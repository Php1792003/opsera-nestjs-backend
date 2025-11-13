import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MasterAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, projects: true, qrcodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isTenantAdmin: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found.`);
    }
    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    await this.findOneTenant(tenantId);
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...dto },
    });
  }

  async impersonate(userIdToImpersonate: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userIdToImpersonate },
    });
    if (!user) {
      throw new NotFoundException('User to impersonate not found.');
    }

    return this.authService['signToken'](user.id, user.tenantId, false); // Luôn set isSuperAdmin = false khi mạo danh
  }
}
