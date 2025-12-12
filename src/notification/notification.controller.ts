import { Controller, Get, UseGuards, Request, Sse, MessageEvent, Query, Put, Param, ParseUUIDPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService
  ) { }

  @Sse('stream')
  stream(@Request() req): Observable<MessageEvent> {
    return this.notificationService.getNotificationStream(req.user.tenantId, req.user.userId);
  }

  @Get()
  async getHistory(@Request() req, @Query('limit') limit = 10) {
    return this.prisma.notification.findMany({
      where: {
        tenantId: req.user.tenantId,
        OR: [{ userId: req.user.userId }, { userId: null }]
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });
  }

  @Put(':id/read')
  async markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }
}