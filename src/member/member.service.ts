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
  ) {}

  async create(dto: CreateMemberDto, tenantId: string, creatorId: string) {
    const { email, roleId, projectId, fullName } = dto;

    // 1. Validate Project and Role
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) {
      throw new NotFoundException('Project not found or access denied.');
    }
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found or access denied.');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. If user exists, add them to the project
    if (user) {
      const existingMember = await this.prisma.projectMember.findFirst({
        where: { userId: user.id, projectId },
      });

      if (existingMember) {
        throw new ConflictException(
          'This user is already a member of the project.',
        );
      }
      
      // OPTIONAL: Update existing user's role to the new roleId from DTO
      await this.prisma.user.update({
        where: { id: user.id },
        data: { roleId },
      });

      // Add existing user to the project. ProjectMember only links User to Project.
      await this.prisma.projectMember.create({
        data: {
          userId: user.id,
          projectId: projectId,
        },
      });

      await this.auditService.logActivity(
        creatorId,
        tenantId,
        'ADD_MEMBER_TO_PROJECT',
        {
          memberId: user.id,
          memberEmail: user.email,
          projectId: projectId,
        },
        'PROJECT',
        projectId,
      );

      return { user, message: 'Existing user added to the project.' };
    }

    // 3. If user does not exist, create them and add to project
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    const currentMemberCount = await this.prisma.user.count({
      where: { tenantId },
    });
    if (currentMemberCount >= tenant.maxUsers) {
      throw new ForbiddenException(
        `User limit of ${tenant.maxUsers} reached for your plan. Please upgrade.`,
      );
    }

    const temporaryPassword = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      strict: true,
    });
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Use email part as fullName if not provided (though HTML now requires it)
    const finalFullName = fullName || email.split('@')[0];

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName: finalFullName,
        password: hashedPassword,
        roleId, // Role is assigned to the User here
        tenantId,
      },
    });

    // Add the new user to the project. ProjectMember only links User to Project.
    await this.prisma.projectMember.create({
      data: {
        userId: newUser.id,
        projectId: projectId,
      },
    });

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_MEMBER_AND_ADD_TO_PROJECT',
      {
        memberId: newUser.id,
        memberEmail: newUser.email,
        roleId: newUser.roleId,
        projectId: projectId,
      },
      'USER',
      newUser.id,
    );

    // Return a subset of user fields to avoid leaking the password
    const { password, ...userResult } = newUser;

    // IMPORTANT: Return temporaryPassword for client display
    return { user: userResult, temporaryPassword };
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isTenantAdmin: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    memberId: string,
    dto: UpdateMemberDto,
    tenantId: string,
    actorId: string,
  ) {
    // We update the User's core data (fullName, roleId) here.
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Member not found or access denied.');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, tenantId },
      });
      if (!role) {
        throw new ForbiddenException('Role not found or access denied.');
      }
    }

    // Only update the fields provided in DTO (fullName and roleId are expected)
    const updatedMember = await this.prisma.user.update({
      where: { id: memberId },
      data: { ...dto },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleId: true,
        tenantId: true,
        isTenantAdmin: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_MEMBER',
      {
        memberId: updatedMember.id,
        changes: dto,
      },
      'USER',
      updatedMember.id,
    );
    
    return updatedMember;
  }

  async remove(memberId: string, tenantId: string, actorId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Member not found or access denied.');
    }
    if (member.isTenantAdmin) {
      throw new ForbiddenException('Cannot remove a tenant administrator.');
    }

    // NOTE: This currently deletes the *User*. In a proper SaaS system,
    // deleting a member from a project would only delete the `ProjectMember` record,
    // unless the user is the last member of the tenant.
    // Assuming the current requirement is to *delete the user* from the tenant scope.
    await this.prisma.user.delete({ where: { id: memberId } });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'DELETE_MEMBER',
      {
        memberId: member.id,
        memberEmail: member.email,
      },
      'USER',
      member.id,
    );

    return {
      message: `Member ${member.email} has been removed successfully.`,
      id: memberId,
    };
  }
}