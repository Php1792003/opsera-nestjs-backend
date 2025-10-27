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

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMemberDto, tenantId: string) {
    // 1. Kiểm tra giới hạn người dùng của tenant
    const [tenant, currentMemberCount] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }
    if (currentMemberCount >= tenant.maxUsers) {
      throw new ForbiddenException(
        `User limit of ${tenant.maxUsers} reached for your plan. Please upgrade.`,
      );
    }

    // 2. Kiểm tra email đã tồn tại trong tenant chưa
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in your organization.',
      );
    }

    // 3. Kiểm tra roleId có hợp lệ không
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });
    if (!role) {
      throw new ForbiddenException('Role not found or access denied.');
    }

    // 4. Tạo mật khẩu ngẫu nhiên
    const temporaryPassword = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      strict: true,
    });

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // 5. Tạo user mới - SỬA LỖI: Sử dụng select
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
        roleId: dto.roleId,
        tenantId: tenantId,
      },
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

    return { user: newUser, temporaryPassword };
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

  async update(memberId: string, dto: UpdateMemberDto, tenantId: string) {
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

    // SỬA LỖI: Sử dụng select
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

    return updatedMember;
  }

  async remove(memberId: string, tenantId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Member not found or access denied.');
    }
    if (member.isTenantAdmin) {
      throw new ForbiddenException('Cannot remove a tenant administrator.');
    }

    await this.prisma.user.delete({ where: { id: memberId } });
    return {
      message: `Member ${member.email} has been removed successfully.`,
      id: memberId,
    };
  }
}
