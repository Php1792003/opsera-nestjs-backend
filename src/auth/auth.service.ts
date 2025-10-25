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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          subscriptionPlan: 'STARTER',
        },
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

    return this.signToken(
      result.user.id,
      result.tenant.id,
      result.user.isSuperAdmin,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.tenantId, user.isSuperAdmin);
  }

  private async signToken(
    userId: string,
    tenantId: string,
    isSuperAdmin: boolean,
  ): Promise<{ accessToken: string }> {
    const payload = {
      sub: userId,
      tenantId: tenantId,
      isSuperAdmin: isSuperAdmin,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
