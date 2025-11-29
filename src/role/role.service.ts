import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  permissionsToString,
  stringToPermissions,
  Permission,
} from './constants/permissions.constant';
import { Role, UserWithRole } from '../types/prisma.types';
import { RoleResponseDto } from './dto/role-response.dto';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  async create(
    dto: CreateRoleDto,
    tenantId: string,
    creatorId: string,
  ): Promise<RoleResponseDto> {
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

    const permissionsStr = permissionsToString(dto.permissions);

    const newRole = await this.prisma.role.create({
      data: {
        name: dto.name,
        permissions: permissionsStr,
        tenantId: tenantId,
        projectId: dto.projectId || null,
      },
    });

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_ROLE',
      {
        roleId: newRole.id,
        roleName: newRole.name,
        permissions: dto.permissions,
      },
      'ROLE',
      newRole.id,
    );

    return this.formatRoleResponse(newRole);
  }

  async findAll(tenantId: string, projectId?: string): Promise<RoleResponseDto[]> {
    const whereCondition: any = { tenantId };

    if (projectId) {
      // STRICT FILTERING: Only return roles specific to this project OR global roles
      whereCondition.OR = [
        { projectId: projectId },
        { projectId: null }
      ];
    }

    const roles = await this.prisma.role.findMany({
      where: whereCondition,
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map((role) => this.formatRoleResponse(role));
  }

  async findOne(id: string, tenantId: string): Promise<RoleResponseDto> {
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

  // CRITICAL FOR INCIDENT ASSIGNMENT
  async findByNameAndProject(name: string, projectId: string, tenantId: string) {
    // 1. Try to find project-specific role first
    let role = await this.prisma.role.findFirst({
      where: {
        name: name,
        projectId: projectId,
        tenantId: tenantId
      }
    });

    // 2. If not found, try to find global tenant role
    if (!role) {
      role = await this.prisma.role.findFirst({
        where: {
          name: name,
          projectId: null,
          tenantId: tenantId
        }
      });
    }

    return role;
  }

  async findMembersByRole(roleId: string, tenantId: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: tenantId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found or access denied.');
    }

    return this.prisma.user.findMany({
      where: {
        roleId: roleId,
        tenantId: tenantId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isTenantAdmin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    tenantId: string,
    actorId: string,
  ): Promise<RoleResponseDto> {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found or access denied.');
    }

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

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_ROLE',
      { roleId: updatedRole.id, changes: dto },
      'ROLE',
      updatedRole.id,
    );

    return this.formatRoleResponse(updatedRole);
  }

  async delete(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<{ message: string; id: string }> {
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

    if (existingRole._count.users > 0) {
      throw new ForbiddenException(
        `Cannot delete role. It has ${existingRole._count.users} user(s). Please reassign users first.`,
      );
    }

    await this.prisma.role.delete({
      where: { id: id },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'DELETE_ROLE',
      { roleId: existingRole.id, roleName: existingRole.name },
      'ROLE',
      existingRole.id,
    );

    return { message: 'Role deleted successfully', id: id };
  }

  private formatRoleResponse(
    role: Role & {
      _count?: { users: number };
      users?: Array<{
        id: string;
        email: string;
        fullName: string;
        createdAt: Date;
      }>;
    },
  ): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.permissions = stringToPermissions(role.permissions);
    dto.tenantId = role.tenantId;
    dto.createdAt = role.createdAt;
    dto.updatedAt = role.updatedAt;
    dto._count = role._count || { users: 0 };
    dto.users = role.users;
    dto.permissionsStr = role.permissions;
    return dto;
  }

  async checkUserPermission(
    userId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })) as UserWithRole | null;

    if (!user) {
      return false;
    }

    if (user.isSuperAdmin) {
      return true;
    }

    if (user.isTenantAdmin) {
      return true;
    }

    if (user.role) {
      const permissions = stringToPermissions(user.role.permissions);
      return permissions.includes(requiredPermission);
    }

    return false;
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    })) as UserWithRole | null;

    if (!user) {
      return [];
    }

    if (user.isSuperAdmin) {
      return Object.values(Permission);
    }

    if (user.isTenantAdmin) {
      return Object.values(Permission);
    }

    if (user.role) {
      return stringToPermissions(user.role.permissions);
    }

    return [];
  }
}