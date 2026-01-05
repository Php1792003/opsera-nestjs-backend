import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MasterAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) { }

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

  async impersonateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }, // QUAN TRỌNG: Phải include role để lấy dữ liệu
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // SỬA LỖI Ở ĐÂY: Truyền đủ 7 tham số cho signToken
    return this.authService.signToken(
      user.id,
      user.tenantId,
      user.isTenantAdmin, // Tham số 3: isTenantAdmin
      user.isSuperAdmin,  // Tham số 4: isSuperAdmin (thường là false khi mạo danh user thường)
      user.email,         // Tham số 5: email
      user.fullName,      // Tham số 6: fullName
      user.role           // Tham số 7: role object
    );
  }
}
