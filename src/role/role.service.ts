import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  permissionsToString,
  stringToPermissions,
  Permission,
} from './constants/permissions.constant';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto, tenantId: string): Promise<any> {
    // Kiểm tra tên role đã tồn tại chưa trong tenant

    const existingRole = await this.prisma.role.findFirst({
      where: {
        name: dto.name,
        tenantId: tenantId,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role "${dto.name}" already exists in your organization.`,
      );
    }

    // Convert permissions array thành string
    const permissionsStr = permissionsToString(dto.permissions);

    const newRole = await this.prisma.role.create({
      data: {
        name: dto.name,
        permissions: permissionsStr,
        tenantId: tenantId,
      },
    });

    return this.formatRoleResponse(newRole);
  }

  async findAll(tenantId: string): Promise<any> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId: tenantId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-return
    return roles.map((role) => this.formatRoleResponse(role));
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found or access denied.');
    }

    return this.formatRoleResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto, tenantId: string): Promise<any> {
    // Kiểm tra role có tồn tại và thuộc tenant không

    const existingRole = await this.prisma.role.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found or access denied.');
    }

    // Nếu đổi tên, kiểm tra tên mới đã tồn tại chưa

    if (dto.name && dto.name !== existingRole.name) {
      const duplicateRole = await this.prisma.role.findFirst({
        where: {
          name: dto.name,
          tenantId: tenantId,
          id: { not: id },
        },
      });

      if (duplicateRole) {
        throw new ConflictException(
          `Role "${dto.name}" already exists in your organization.`,
        );
      }
    }

    // Prepare update data
    const updateData: { name?: string; permissions?: string } = {};
    if (dto.name) {
      updateData.name = dto.name;
    }
    if (dto.permissions) {
      updateData.permissions = permissionsToString(dto.permissions);
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return this.formatRoleResponse(updatedRole);
  }

  async delete(id: string, tenantId: string): Promise<any> {
    // Kiểm tra role có tồn tại và thuộc tenant không

    const existingRole = await this.prisma.role.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found or access denied.');
    }

    // Kiểm tra role có users không

    if (existingRole._count.users > 0) {
      throw new ForbiddenException(
        `Cannot delete role. It has ${existingRole._count.users} user(s). Please reassign users first.`,
      );
    }

    await this.prisma.role.delete({
      where: { id: id },
    });

    return { message: 'Role deleted successfully', id: id };
  }

  // Helper method để format response với permissions array
  private formatRoleResponse(role: any): any {
    return {
      ...role,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      permissions: stringToPermissions(role.permissions as string),
    };
  }

  // Method để kiểm tra user có permission không
  async checkUserPermission(
    userId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return false;
    }

    // Super admin có tất cả quyền

    if (user.isSuperAdmin) {
      return true;
    }

    // Tenant admin có tất cả quyền trong tenant

    if (user.isTenantAdmin) {
      return true;
    }

    // Kiểm tra permissions trong role

    if (user.role) {
      const permissions = stringToPermissions(user.role.permissions);
      return permissions.includes(requiredPermission);
    }

    return false;
  }

  // Method để lấy tất cả permissions của user
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return [];
    }

    // Super admin có tất cả quyền

    if (user.isSuperAdmin) {
      return Object.values(Permission);
    }

    // Tenant admin có tất cả quyền trong tenant

    if (user.isTenantAdmin) {
      return Object.values(Permission);
    }

    // Lấy permissions từ role

    if (user.role) {
      return stringToPermissions(user.role.permissions);
    }

    return [];
  }
}
