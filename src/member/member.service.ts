import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import * as bcrypt from 'bcrypt';
import * as generator from 'generate-password';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  async create(dto: CreateMemberDto, tenantId: string, creatorId: string) {
    const { email, roleId, projectId, fullName, password, isTenantAdmin, status } = dto;

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) throw new NotFoundException('Role not found.');

    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
      });
      if (!project) throw new NotFoundException('Project not found.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (projectId) {
        const isMember = await this.prisma.projectMember.findFirst({
          where: { userId: existingUser.id, projectId },
        });
        if (isMember) throw new ConflictException('User is already in this project.');

        await this.prisma.projectMember.create({
          data: { userId: existingUser.id, projectId },
        });
      }

      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          roleId,
          isTenantAdmin: isTenantAdmin ?? existingUser.isTenantAdmin,
          status: 'active'
        },
      });

      return { user: existingUser, message: 'Existing user updated/added to project.' };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }, select: { maxUsers: true }
    });
    const currentCount = await this.prisma.user.count({
      where: { tenantId, status: { not: 'DELETED' } }
    });

    if (tenant && currentCount >= tenant.maxUsers) {
      throw new ForbiddenException('User limit reached.');
    }

    const rawPassword = password || generator.generate({ length: 12, numbers: true });
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName: fullName || email.split('@')[0],
        password: hashedPassword,
        roleId,
        tenantId,
        isTenantAdmin: isTenantAdmin || false,
        status: status || 'active',
      },
    });

    if (projectId) {
      await this.prisma.projectMember.create({
        data: { userId: newUser.id, projectId },
      });
    }

    await this.auditService.logActivity(
      creatorId, tenantId, 'CREATE_MEMBER',
      { email: newUser.email }, 'USER', newUser.id
    );

    const { password: _, ...result } = newUser;
    return { user: result, temporaryPassword: password ? null : rawPassword };
  }

  async findAll(tenantId: string, projectId?: string) {
    const whereCondition: any = {
      tenantId: tenantId,
      status: { not: 'DELETED' },
    };

    if (projectId) {
      whereCondition.projectMembers = { some: { projectId } };
    }

    return this.prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        email: true,
        fullName: true,
        isTenantAdmin: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateMemberDto, tenantId: string, actorId: string) {
    const updateData: any = { ...dto };
    delete updateData.projectId;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedMember = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logActivity(
      actorId, tenantId, 'UPDATE_MEMBER', { memberId: id }, 'USER', id
    );
    return updatedMember;
  }

  async remove(id: string, tenantId: string, actorId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!member) throw new NotFoundException('Member not found.');
    if (member.id === actorId) throw new ForbiddenException('Cannot delete yourself.');

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({
        where: { userId: id },
      });

      const deletedEmail = `deleted_${Date.now()}_${member.email}`;

      await tx.user.update({
        where: { id },
        data: {
          status: 'DELETED',
          email: deletedEmail,
          password: await bcrypt.hash(generator.generate({ length: 20 }), 10),
          isTenantAdmin: false,
        }
      });
    });

    await this.auditService.logActivity(
      actorId, tenantId, 'DELETE_MEMBER',
      { originalEmail: member.email }, 'USER', id
    );

    return { message: 'User deactivated and removed from projects successfully.', id };
  }
}