import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'secretKey',
            });

            const userId = payload.userId;
            const tenantId = payload.tenantId;
            client.join(`user_${userId}`);
            client.join(`tenant_${tenantId}`);

            console.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (e) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    sendNotification(userId: string | null, tenantId: string, payload: any) {
        if (userId) {
            this.server.to(`user_${userId}`).emit('notification', payload);
        } else {
            this.server.to(`tenant_${tenantId}`).emit('notification', payload);
        }
    }
}