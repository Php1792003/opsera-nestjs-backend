import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'secretKey' }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule { }
