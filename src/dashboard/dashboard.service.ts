import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      completedTasks,
      totalScansToday,
      overdueTasks,
      recentActivities,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),

      this.prisma.task.count({ where: { tenantId, status: 'COMPLETED' } }),

      this.prisma.scanLog.count({
        where: { tenantId, scannedAt: { gte: today } },
      }),

      this.prisma.task.count({
        where: {
          tenantId,
          status: { not: 'COMPLETED' },
          deadline: { lt: new Date() },
        },
      }),

      this.prisma.activityLog.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      }),
    ]);

    return {
      totalMembers,
      completedTasks,
      totalScansToday,
      overdueTasks,
      recentActivities,
    };
  }
}
