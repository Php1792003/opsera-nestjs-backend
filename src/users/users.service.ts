import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true
                    }
                },
                tenant: {
                    select: { name: true, subscriptionPlan: true }
                }
            },
        });

        if (!user) throw new NotFoundException('User not found');

        const { password, ...result } = user;
        return result;
    }

    async create(dto: CreateUserDto, tenantId: string) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) throw new ConflictException('Email đã tồn tại');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        return this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                fullName: dto.fullName,
                avatar: dto.avatar,
                roleId: dto.roleId,
                isTenantAdmin: dto.isTenantAdmin || false,
                tenantId: tenantId,
            },
        });
    }

    // --- 3. LẤY DANH SÁCH USER (CÙNG TENANT) ---
    async findAll(tenantId: string) {
        return this.prisma.user.findMany({
            where: { tenantId },
            include: {
                role: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // --- 4. LẤY CHI TIẾT 1 USER ---
    async findOne(id: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
            include: { role: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    // --- 5. CẬP NHẬT USER ---
    async update(id: string, dto: UpdateUserDto, tenantId: string) {
        await this.findOne(id, tenantId); // Check tồn tại

        const data: any = { ...dto };
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: data,
        });
    }

    // --- 6. XÓA USER ---
    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId); // Check tồn tại
        return this.prisma.user.delete({
            where: { id },
        });
    }
}