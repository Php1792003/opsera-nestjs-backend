import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Prisma } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly prisma: PrismaService, // Inject Prisma để truy vấn
  ) {}

  @Get()
  async getMyNotifications(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { userId, tenantId } = req.user;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      OR: [{ userId: userId }, { userId: null }],
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      data: notifications,
      totalItems: total,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    const { userId, tenantId } = req.user;

    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId,
        OR: [{ userId: userId }, { userId: null }],
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found or access denied.');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   */
  @Put('read-all')
  async markAllAsRead(@Request() req: RequestWithUser) {
    const { userId, tenantId } = req.user;

    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        isRead: false,
        OR: [{ userId: userId }, { userId: null }],
      },
      data: { isRead: true },
    });

    return { message: `${result.count} notifications marked as read.` };
  }
}
