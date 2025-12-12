import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class ChatService {
    private onlineUsers = new Map<string, boolean>();

    constructor(private prisma: PrismaService) { }

    setUserOnline(userId: string) { this.onlineUsers.set(userId, true); }
    setUserOffline(userId: string) { this.onlineUsers.delete(userId); }
    isUserOnline(userId: string): boolean { return this.onlineUsers.has(userId); }

    async getAllTenantMembers(tenantId: string, currentUserId: string) {
        const users = await this.prisma.user.findMany({
            where: { tenantId: tenantId, id: { not: currentUserId }, status: 'ACTIVE' },
            select: { id: true, fullName: true, email: true, avatar: true, role: { select: { name: true } } }
        });

        return users.map(user => ({
            id: user.id, userId: user.id, name: user.fullName, fullName: user.fullName, email: user.email,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`,
            role: user.role?.name || 'Thành viên', online: this.isUserOnline(user.id)
        }));
    }

    async getProjectMembers(projectId: string, currentUserId: string) {
        const members = await this.prisma.projectMember.findMany({
            where: { projectId, userId: { not: currentUserId } },
            include: { user: { select: { id: true, fullName: true, email: true, avatar: true, role: { select: { name: true } } } } }
        });
        return members.map(member => {
            const user = member.user;
            if (!user) return null;
            return {
                id: user.id, userId: user.id, name: user.fullName, fullName: user.fullName, email: user.email,
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`,
                role: user.role?.name || 'Thành viên', online: this.isUserOnline(user.id)
            };
        }).filter(item => item !== null);
    }

    async getUserForCall(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, fullName: true, avatar: true, email: true }
        });
        if (user && !user.avatar) {
            user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
        }
        return user;
    }

    async getConversations(userId: string, projectId?: string) {
        const whereClause: any = { userId, isArchived: false };
        if (projectId) { whereClause.conversation = { projectId }; }

        const memberships = await this.prisma.conversationMember.findMany({
            where: whereClause,
            include: {
                conversation: {
                    include: {
                        messages: { orderBy: { createdAt: 'desc' }, take: 1, where: { deletedFor: { none: { userId } } } },
                        members: { include: { user: { select: { id: true, fullName: true, avatar: true, email: true } } } }
                    }
                }
            },
            orderBy: [{ isPinned: 'desc' }, { conversation: { lastMessageAt: 'desc' } }, { conversation: { updatedAt: 'desc' } }]
        });

        return memberships.map(m => {
            const conv = m.conversation;
            let name = conv.name; let avatar = conv.avatar; let online = false;
            if (conv.type === 'DIRECT') {
                const otherMember = conv.members.find(mem => mem.userId !== userId);
                if (otherMember && otherMember.user) {
                    name = otherMember.user.fullName;
                    avatar = otherMember.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                    online = this.isUserOnline(otherMember.userId);
                }
            }
            const lastMsg = conv.messages[0];
            let preview = 'Bắt đầu cuộc trò chuyện';
            let lastTime = conv.createdAt;
            if (lastMsg) {
                lastTime = lastMsg.createdAt;
                if (lastMsg.isDeleted) preview = 'Tin nhắn đã thu hồi';
                else if (lastMsg.type === 'IMAGE') preview = '[Hình ảnh]';
                else if (lastMsg.type === 'CALL_LOG') preview = lastMsg.content || preview;
                else preview = lastMsg.content || preview;
            }
            return {
                id: conv.id, name: name || 'Unknown', avatar: avatar, type: conv.type,
                unreadCount: m.unreadCount, isPinned: m.isPinned, isMuted: m.isMuted,
                lastMessage: preview, lastTime: lastTime, online: online,
                members: conv.members.map(mem => ({ userId: mem.userId, fullName: mem.user.fullName, avatar: mem.user.avatar, role: mem.role }))
            };
        });
    }

    // === [FIXED] LOGIC TẠO CHAT DIRECT ===
    async createDirectConversation(creatorId: string, targetUserId: string, projectId: string | undefined, tenantId: string) {

        // 1. TÌM KIẾM TRƯỚC (Quan trọng: Dùng AND để tìm chính xác chat giữa 2 người)
        const existing = await this.prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    { members: { some: { userId: creatorId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
            },
            include: { members: true }
        });

        // Nếu tìm thấy -> Trả về ngay (Bất kể có projectId hay không)
        if (existing) return existing;

        // 2. NẾU CHƯA CÓ -> TẠO MỚI
        // Lưu ý: projectId có thể là null/undefined nếu chat từ danh sách nhân viên toàn cục
        return this.prisma.conversation.create({
            data: {
                type: 'DIRECT',
                name: 'Direct Chat',
                ...(projectId && { projectId }), // Chỉ thêm projectId nếu có giá trị
                tenantId,
                members: {
                    create: [
                        { userId: creatorId },
                        { userId: targetUserId }
                    ]
                }
            },
            include: { members: true }
        });
    }

    async createGroup(dto: CreateGroupDto, creatorId: string, tenantId: string) {
        return this.prisma.conversation.create({
            data: {
                type: 'GROUP', name: dto.name, projectId: dto.projectId, tenantId,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.name)}&background=random`,
                adminId: creatorId,
                members: { create: [{ userId: creatorId, role: 'ADMIN' }, ...dto.memberIds.map(id => ({ userId: id }))] }
            }
        });
    }

    async saveMessage(dto: CreateMessageDto, senderId: string) {
        const message = await this.prisma.message.create({
            data: { conversationId: dto.conversationId, senderId, content: dto.content, type: dto.type || 'TEXT', metadata: dto.metadata, replyToId: dto.replyToId },
            include: { sender: { select: { id: true, fullName: true, avatar: true } }, reactions: true }
        });
        await this.prisma.conversation.update({ where: { id: dto.conversationId }, data: { lastMessageId: message.id, lastMessageAt: new Date() } });
        await this.prisma.conversationMember.updateMany({ where: { conversationId: dto.conversationId, userId: { not: senderId }, isMuted: false }, data: { unreadCount: { increment: 1 } } });
        return message;
    }

    async getMessages(conversationId: string, userId: string, limit: number, offset: number) {
        const msgs = await this.prisma.message.findMany({
            where: { conversationId, deletedFor: { none: { userId } } },
            orderBy: { createdAt: 'desc' }, take: Number(limit), skip: Number(offset),
            include: { sender: { select: { id: true, fullName: true, avatar: true } }, reactions: true, seenBy: { include: { user: { select: { id: true, fullName: true, avatar: true } } } } }
        });
        return msgs.reverse();
    }

    async deleteMessage(messageId: string, userId: string) {
        const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!msg || msg.senderId !== userId) throw new ForbiddenException();
        return this.prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: 'Tin nhắn đã bị thu hồi', type: 'SYSTEM' }, include: { sender: { select: { id: true, fullName: true, avatar: true } } } });
    }

    async editMessage(messageId: string, userId: string, newContent: string) {
        const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!msg || msg.senderId !== userId || msg.isDeleted) throw new ForbiddenException();
        return this.prisma.message.update({ where: { id: messageId }, data: { content: newContent }, include: { sender: { select: { id: true, fullName: true, avatar: true } } } });
    }

    async togglePin(conversationId: string, userId: string) {
        const member = await this.prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
        if (!member) throw new NotFoundException();
        const updated = await this.prisma.conversationMember.update({ where: { id: member.id }, data: { isPinned: !member.isPinned } });
        return { isPinned: updated.isPinned, conversationId };
    }

    async createCallLogMessage(conversationId: string, callerId: string, duration: number, status: string) {
        let content = status === 'MISSED' ? '📞 Cuộc gọi nhỡ' : (status === 'REJECTED' ? '📞 Cuộc gọi bị từ chối' : `📞 Cuộc gọi kết thúc - ${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`);
        const message = await this.prisma.message.create({ data: { conversationId, senderId: callerId, content, type: 'CALL_LOG', metadata: JSON.stringify({ duration, status }) }, include: { sender: { select: { id: true, fullName: true, avatar: true } } } });
        await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return message;
    }

    async reactToMessage(messageId: string, userId: string, type: string) {
        // 1. Kiểm tra xem user đã thả cảm xúc này chưa
        const existingReaction = await this.prisma.messageReaction.findFirst({
            where: { messageId, userId }
        });

        if (existingReaction) {
            // Nếu đã thả đúng loại này -> Xóa (Toggle Off)
            if (existingReaction.type === type) {
                await this.prisma.messageReaction.delete({ where: { id: existingReaction.id } });
            } else {
                // Nếu thả loại khác -> Đổi sang loại mới
                await this.prisma.messageReaction.update({
                    where: { id: existingReaction.id },
                    data: { type }
                });
            }
        } else {
            // Chưa thả -> Tạo mới
            await this.prisma.messageReaction.create({
                data: { messageId, userId, type }
            });
        }

        // 2. Trả về danh sách reaction mới nhất của tin nhắn đó để cập nhật UI
        const updatedReactions = await this.prisma.messageReaction.findMany({
            where: { messageId },
            include: { user: { select: { id: true, fullName: true, avatar: true } } }
        });

        return updatedReactions;
    }

    async markAsRead(conversationId: string, userId: string) { await this.prisma.conversationMember.updateMany({ where: { conversationId, userId }, data: { unreadCount: 0 } }); return { success: true }; }
    async toggleMute(conversationId: string, userId: string) { return { muted: true }; }
    async getRecipients(conversationId: string, excludeUserId: string) { return this.prisma.conversationMember.findMany({ where: { conversationId, userId: { not: excludeUserId } } }); }
    async markSeen(conversationId: string, userId: string, messageId: string) { return {}; }
}