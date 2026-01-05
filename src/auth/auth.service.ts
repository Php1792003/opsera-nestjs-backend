import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult } from '../types/prisma.types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: { name: dto.companyName, subscriptionPlan: 'STARTER' },
      });

      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          password: hashedPassword,
          tenantId: newTenant.id,
          isTenantAdmin: true,
        },
      });

      return { user: newUser, tenant: newTenant };
    });

    await this.auditService.logActivity(
      result.user.id,
      result.tenant.id,
      'USER_REGISTER',
      { email: result.user.email, tenantName: result.tenant.name },
      'USER',
      result.user.id,
    );

    return this.signToken(
      result.user.id,
      result.tenant.id,
      result.user.isTenantAdmin,
      result.user.isSuperAdmin,
      result.user.email,
      result.user.fullName,
      null,
    );
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true }, // Lấy thông tin Role
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      // ... (Giữ nguyên logic audit fail) ...
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.logActivity(
      user.id,
      user.tenantId,
      'USER_LOGIN_SUCCESS',
      { method: 'password' },
      'USER',
      user.id,
    );

    return this.signToken(
      user.id,
      user.tenantId,
      user.isTenantAdmin,
      user.isSuperAdmin,
      user.email,
      user.fullName,
      user.role, // Truyền role xuống
    );
  }

  // Đổi từ private -> public để MasterAdminService có thể gọi
  public async signToken(
    userId: string,
    tenantId: string,
    isTenantAdmin: boolean,
    isSuperAdmin: boolean,
    email?: string,
    fullName?: string,
    role?: any,
  ): Promise<{ accessToken: string; user?: any }> {
    const payload = {
      sub: userId,
      tenantId: tenantId,
      isSuperAdmin: isSuperAdmin,
      roleId: role?.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true, name: true },
    });

    return {
      accessToken,
      user: {
        id: userId,
        email: email,
        fullName: fullName,
        tenantId: tenantId,
        isTenantAdmin: isTenantAdmin,
        isSuperAdmin: isSuperAdmin,
        tenant: tenant,
        role: role
          ? {
            id: role.id,
            name: role.name,
            permissions: role.permissions,
          }
          : null,
      },
    };
  }
}