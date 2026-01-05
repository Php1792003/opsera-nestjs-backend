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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  // --- HÀM HỖ TRỢ LƯU AVATAR ---
  private saveAvatar(base64String: string): string | null {
    if (!base64String || !base64String.startsWith('data:image')) return null;

    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `avatar_${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/avatars/${fileName}`; // Trả về đường dẫn
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
    return null;
  }

  // --- CREATE ---
  async create(
    dto: CreateMemberDto & { avatar?: string },
    tenantId: string,
    creatorId: string,
  ) {
    const {
      email,
      roleId,
      projectId,
      fullName,
      password,
      isTenantAdmin,
      status,
      avatar,
    } = dto;

    // Check Role
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) throw new NotFoundException('Role not found.');

    // Check Project
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
      // User đã tồn tại -> Add vào Project
      if (projectId) {
        const isMember = await this.prisma.projectMember.findFirst({
          where: { userId: existingUser.id, projectId },
        });
        if (isMember)
          throw new ConflictException('User is already in this project.');
        await this.prisma.projectMember.create({
          data: { userId: existingUser.id, projectId },
        });
      }

      // Update thông tin user hiện có
      let updateData: any = {
        roleId, // Cập nhật Role mới
        isTenantAdmin: isTenantAdmin ?? existingUser.isTenantAdmin,
        status: 'active',
      };

      if (avatar && avatar.startsWith('data:image')) {
        const newPath = this.saveAvatar(avatar);
        if (newPath) updateData.avatar = newPath;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
        include: { role: true }, // Trả về role để Frontend hiển thị ngay
      });

      return {
        user: updatedUser,
        message: 'Existing user updated/added to project.',
      };
    }

    // Check Limit User
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    });
    const currentCount = await this.prisma.user.count({
      where: { tenantId, status: { not: 'DELETED' } },
    });
    if (tenant && currentCount >= tenant.maxUsers)
      throw new ForbiddenException('User limit reached.');

    // Tạo User Mới
    const rawPassword =
      password || generator.generate({ length: 12, numbers: true });
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const avatarPath = this.saveAvatar(avatar || '');

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName: fullName || email.split('@')[0],
        password: hashedPassword,
        roleId, // Gán Role ID
        tenantId,
        isTenantAdmin: isTenantAdmin || false,
        status: status || 'active',
        avatar: avatarPath,
      },
      include: { role: true }, // Quan trọng: Include Role để trả về
    });

    if (projectId) {
      await this.prisma.projectMember.create({
        data: { userId: newUser.id, projectId },
      });
    }

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_MEMBER',
      { email: newUser.email, roleName: role.name }, // Log thêm tên role
      'USER',
      newUser.id,
    );

    const { password: _, ...result } = newUser;
    return { user: result, temporaryPassword: password ? null : rawPassword };
  }

  // --- FIND ALL (GET LIST) ---
  async findAll(tenantId: string, projectId?: string) {
    const whereCondition: any = {
      tenantId: tenantId,
      status: { not: 'DELETED' },
    };
    if (projectId) whereCondition.projectMembers = { some: { projectId } };

    return this.prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        email: true,
        fullName: true,
        isTenantAdmin: true,
        isSuperAdmin: true, // Thêm cái này để FE check quyền Super
        status: true,
        createdAt: true,
        avatar: true,
        roleId: true, // Lấy ID để binding vào form edit
        role: {
          // <--- QUAN TRỌNG NHẤT: Lấy thông tin Role để hiển thị Header/Table
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- UPDATE ---
  async update(
    id: string,
    dto: UpdateMemberDto & { avatar?: string },
    tenantId: string,
    actorId: string,
  ) {
    const updateData: any = { ...dto };
    delete updateData.projectId;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete updateData.password;
    }

    // Xử lý Avatar
    if (dto.avatar && dto.avatar.startsWith('data:image')) {
      const newPath = this.saveAvatar(dto.avatar);
      if (newPath) {
        updateData.avatar = newPath;
      }
    } else {
      // Nếu không gửi base64 mới, xóa field avatar khỏi object update để giữ nguyên ảnh cũ
      delete updateData.avatar;
    }

    const updatedMember = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        // Include Role để sau khi update xong, FE nhận được data mới nhất luôn
        role: {
          select: { id: true, name: true, permissions: true },
        },
      },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_MEMBER',
      { memberId: id, updates: Object.keys(updateData) },
      'USER',
      id,
    );
    return updatedMember;
  }

  // --- REMOVE ---
  async remove(id: string, tenantId: string, actorId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!member) throw new NotFoundException('Member not found.');
    if (member.id === actorId)
      throw new ForbiddenException('Cannot delete yourself.');

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({ where: { userId: id } });
      const deletedEmail = `deleted_${Date.now()}_${member.email}`;
      await tx.user.update({
        where: { id },
        data: {
          status: 'DELETED',
          email: deletedEmail,
          password: await bcrypt.hash(generator.generate({ length: 20 }), 10),
          isTenantAdmin: false,
          avatar: null,
        },
      });
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'DELETE_MEMBER',
      { originalEmail: member.email },
      'USER',
      id,
    );
    return { message: 'User deactivated successfully.', id };
  }
}