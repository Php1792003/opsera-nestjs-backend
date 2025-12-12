import { Injectable, MessageEvent } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Task } from '@prisma/client';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  // Luồng sự kiện nội bộ
  private notificationSubject = new Subject<{
    tenantId: string;
    userId?: string;
    payload: any
  }>();

  constructor(private readonly prisma: PrismaService, private readonly notificationGateway: NotificationGateway) { }

  getNotificationStream(tenantId: string, userId: string): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((event) => {
        if (event.tenantId !== tenantId) return false;
        if (event.userId && event.userId !== userId) return false;
        return true;
      }),
      map((event) => ({ data: event.payload } as MessageEvent)),
    );
  }

  // Hàm Core tạo & gửi thông báo
  async createAndSend(data: {
    tenantId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    userId?: string; // Null = Broadcast
  }) {
    // 1. Lưu DB
    const noti = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId || null,
      },
    });

    this.notificationGateway.sendNotification(data.userId || null, data.tenantId, noti);

    return noti;
  }

  // --- NGHIỆP VỤ CỤ THỂ ---

  // 1. Thông báo khi Giao Task (Quan trọng: Đã sửa tên hàm cho khớp với TaskService)
  async sendTaskAssignedNotification(
    assignee: User,
    task: Task,
    assigner: User,
  ) {
    const title = `Công việc mới: "${task.title}"`;
    const message = `${assigner.fullName} đã phân công công việc này cho bạn.`;

    await this.createAndSend({
      tenantId: assignee.tenantId,
      userId: assignee.id, // Gửi riêng cho người được giao
      title,
      message,
      type: 'INFO'
    });
  }

  // 2. Thông báo chung cho User
  async notifyUser(userId: string, tenantId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') {
    return this.createAndSend({ tenantId, userId, title, message, type });
  }

  // 3. Thông báo cho Role (Incident)
  async notifyRole(roleName: string, tenantId: string, title: string, message: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, role: { name: roleName }, status: 'active' },
      select: { id: true }
    });
    for (const user of users) {
      await this.createAndSend({ tenantId, userId: user.id, title, message, type: 'WARNING' });
    }
  }

  // 4. Broadcast
  async notifyBroadcast(tenantId: string, title: string, message: string) {
    return this.createAndSend({ tenantId, userId: undefined, title, message, type: 'ERROR' });
  }
}