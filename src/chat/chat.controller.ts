import {
    Controller, Get, Post, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile, ParseUUIDPipe, Put, Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway
    ) { }

    // [UPDATE] Không bắt buộc projectId nữa
    @Get('conversations')
    async getConversations(@Request() req, @Query('projectId') projectId?: string) {
        return this.chatService.getConversations(req.user.userId, projectId);
    }

    // [NEW] API lấy toàn bộ nhân viên trong Tenant
    @Get('members')
    async getAllMembers(@Request() req) {
        // req.user.tenantId được lấy từ JWT Token
        return this.chatService.getAllTenantMembers(req.user.tenantId, req.user.userId);
    }

    // [OLD] API cũ lấy theo project (Giữ lại để tương thích ngược nếu cần)
    @Get('project/:projectId/members')
    async getProjectMembers(@Request() req, @Param('projectId') projectId: string) {
        return this.chatService.getProjectMembers(projectId, req.user.userId);
    }

    @Post('direct')
    async createDirectConversation(@Request() req, @Body() body: any) {
        // [NOTE] body.projectId có thể null
        const conversation = await this.chatService.createDirectConversation(req.user.userId, body.targetUserId, body.projectId, req.user.tenantId);
        return {
            ...conversation,
            messages: await this.chatService.getMessages(conversation.id, req.user.userId, 20, 0)
        };
    }

    @Post('groups')
    createGroup(@Request() req, @Body() dto: CreateGroupDto) {
        return this.chatService.createGroup(dto, req.user.userId, req.user.tenantId);
    }

    @Post('messages')
    async sendMessage(@Request() req, @Body() dto: CreateMessageDto) {
        const message = await this.chatService.saveMessage(dto, req.user.userId);
        return message;
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/chat',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: { fileSize: 20 * 1024 * 1024 },
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/chat/${file.filename}`,
            originalName: file.originalname,
            type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE'
        };
    }

    @Put('conversations/:id/read')
    markRead(@Request() req, @Param('id') id: string) {
        return this.chatService.markAsRead(id, req.user.userId);
    }

    @Get('conversations/:conversationId/messages')
    getMessages(@Request() req, @Param('conversationId', ParseUUIDPipe) conversationId: string, @Query('limit') limit: number = 50, @Query('offset') offset: number = 0) {
        return this.chatService.getMessages(conversationId, req.user.userId, limit, offset);
    }

    @Delete('messages/:id')
    async deleteMessage(@Request() req, @Param('id') id: string) {
        const updatedMsg = await this.chatService.deleteMessage(id, req.user.userId);
        this.chatGateway.server.to(`conversation_${updatedMsg.conversationId}`).emit('messageUpdated', updatedMsg);
        return updatedMsg;
    }

    @Put('messages/:id')
    async editMessage(@Request() req, @Param('id') id: string, @Body('content') content: string) {
        const updatedMsg = await this.chatService.editMessage(id, req.user.userId, content);
        this.chatGateway.server.to(`conversation_${updatedMsg.conversationId}`).emit('messageUpdated', updatedMsg);
        return updatedMsg;
    }
}