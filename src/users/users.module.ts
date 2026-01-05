import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, PrismaService],
    exports: [UsersService], // Export để module Auth có thể dùng nếu cần
})
export class UsersModule { }