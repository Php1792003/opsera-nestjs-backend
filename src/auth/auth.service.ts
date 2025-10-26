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

  async register(dto: RegisterDto): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const result = await this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          subscriptionPlan: 'STARTER',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.signToken(
      result.user.id,
      result.tenant.id,
      result.user.isSuperAdmin,
    );
  }

  async login(dto: LoginDto): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
