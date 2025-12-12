import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({ secret: process.env.JWT_SECRET || 'secretKey' }),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
})
export class ChatModule { }