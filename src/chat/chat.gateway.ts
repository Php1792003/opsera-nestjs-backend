import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private jwtService: JwtService, private chatService: ChatService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            if (!token) { client.disconnect(); return; }
            const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            client.data.user = payload;
            client.join(`user_${payload.sub}`);
            this.chatService.setUserOnline(payload.sub);
            this.server.emit('userStatus', { userId: payload.sub, online: true });
        } catch (e) { client.disconnect(); }
    }

    handleDisconnect(client: Socket) {
        if (client.data.user) {
            const user = client.data.user;
            this.chatService.setUserOffline(user.sub);
            this.server.emit('userStatus', { userId: user.sub, online: false });
        }
    }

    // 1. GỬI TIN NHẮN
    @SubscribeMessage('sendMessage')
    async handleMessage(@MessageBody() createMessageDto: CreateMessageDto, @ConnectedSocket() client: Socket) {
        const senderId = client.data.user.sub;
        const message = await this.chatService.saveMessage(createMessageDto, senderId);

        // Gửi cho người nhận
        const recipients = await this.chatService.getRecipients(createMessageDto.conversationId, senderId);
        client.emit('newMessage', message); // Gửi lại cho mình
        recipients.forEach((member) => { this.server.to(`user_${member.userId}`).emit('newMessage', message); });
    }

    // 2. THAM GIA PHÒNG
    @SubscribeMessage('joinConversation')
    handleJoinRoom(@MessageBody('conversationId') conversationId: string, @ConnectedSocket() client: Socket) {
        client.join(`conversation_${conversationId}`);
    }

    // 3. GỌI ĐIỆN (SIGNALING)
    @SubscribeMessage('call-user')
    public async callUser(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        const callerId = client.data.user.sub;
        const callerInfo = await this.chatService.getUserForCall(callerId);

        if (callerInfo) {
            this.server.to(`user_${data.userToCall}`).emit('call-made', {
                offer: data.signalData,
                socket: client.id,
                fromUserId: callerId,
                fromUserName: callerInfo.fullName,
                fromUserAvatar: callerInfo.avatar,
                isVideoCall: data.isVideoCall
            });
        }
    }

    @SubscribeMessage('make-answer')
    public makeAnswer(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        this.server.to(`user_${data.toUser}`).emit('answer-made', { socket: client.id, answer: data.signal });
    }

    @SubscribeMessage('ice-candidate')
    public handleIceCandidate(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        this.server.to(`user_${data.toUser}`).emit('ice-candidate', { candidate: data.candidate, fromUser: client.data.user.sub });
    }

    @SubscribeMessage('end-call')
    async endCall(@MessageBody() data: { toUser: string, conversationId: string, duration: number, status: string }, @ConnectedSocket() client: Socket) {
        const callerId = client.data.user.sub;

        // Lưu log nếu có conversationId (Tức là cuộc gọi từ trong chat)
        if (data.conversationId) {
            const message = await this.chatService.createCallLogMessage(
                data.conversationId, callerId, data.duration || 0, data.status || 'ENDED'
            );
            const recipients = await this.chatService.getRecipients(data.conversationId, callerId);
            client.emit('newMessage', message);
            recipients.forEach((member) => { this.server.to(`user_${member.userId}`).emit('newMessage', message); });
        }

        this.server.to(`user_${data.toUser}`).emit('call-ended', { fromUser: callerId });
    }

    // 4. CÁC SỰ KIỆN TƯƠNG TÁC MỚI
    @SubscribeMessage('typing')
    handleTyping(@MessageBody() data: { conversationId: string, isTyping: boolean }, @ConnectedSocket() client: Socket) {
        const userId = client.data.user.sub;
        // Gửi broadcast tới những người đang join phòng chat này
        client.broadcast.to(`conversation_${data.conversationId}`).emit('userTyping', { userId, isTyping: data.isTyping });
    }

    @SubscribeMessage('markSeen')
    async handleSeen(@MessageBody() data: { conversationId: string, messageId: string }, @ConnectedSocket() client: Socket) {
        const userId = client.data.user.sub;
        await this.chatService.markSeen(data.conversationId, userId, data.messageId);
        // Báo cho cả phòng biết user này đã xem
        this.server.to(`conversation_${data.conversationId}`).emit('messageSeen', {
            conversationId: data.conversationId, messageId: data.messageId, userId
        });
    }

    @SubscribeMessage('addReaction')
    async handleReaction(@MessageBody() data: { messageId: string, type: string, conversationId: string }, @ConnectedSocket() client: Socket) {
        const userId = client.data.user.sub;
        const reactions = await this.chatService.reactToMessage(data.messageId, userId, data.type);
        this.server.to(`conversation_${data.conversationId}`).emit('messageReactionUpdate', {
            messageId: data.messageId,
            reactions
        });
    }

    @SubscribeMessage('toggle-camera')
    handleCameraToggle(@MessageBody() data: { toUser: string, status: boolean }, @ConnectedSocket() client: Socket) {
        this.server.to(`user_${data.toUser}`).emit('remote-camera-toggled', data.status);
    }

    @SubscribeMessage('call-busy')
    handleBusy(@MessageBody() data: { toUser: string }, @ConnectedSocket() client: Socket) {
        this.server.to(`user_${data.toUser}`).emit('user-busy', {
            userId: client.data.user.sub
        });
    }
}