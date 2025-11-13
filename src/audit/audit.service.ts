import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logActivity(
    userId: string,
    tenantId: string,
    action: string,
    details?: any,
    entity?: string,
    entityId?: string,
  ) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        tenantId,
        action,
        details: details ? JSON.stringify(details) : null,
        entity: entity || null,
        entityId: entityId || null,
      },
    });
  }

  async logMasterActivity(
    masterAdminId: string,
    action: string,
    details?: any,
    entity?: string,
    entityId?: string,
  ) {
    // Lưu ý: Các trường entity và entityId cần tồn tại trong model MasterActivityLog
    return this.prisma.masterActivityLog.create({
      data: {
        masterAdminId,
        action,
        details: details ? JSON.stringify(details) : null,
        // entity: entity || null, // Cần thêm vào schema
        // entityId: entityId || null, // Cần thêm vào schema
      },
    });
  }

  async getActivityLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      entity?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      userId,
      action,
      entity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.ActivityLogWhereInput = { tenantId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMasterActivityLogs(
    filters: {
      masterAdminId?: string;
      action?: string;
      entity?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      masterAdminId,
      action,
      entity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.MasterActivityLogWhereInput = {};

    if (masterAdminId) where.masterAdminId = masterAdminId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.masterActivityLog.findMany({
        where,
        include: {
          masterAdmin: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.masterActivityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActivityStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const actionStats = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const entityStats = await this.prisma.activityLog.groupBy({
      by: ['entity'],
      where: {
        tenantId,
        createdAt: { gte: startDate },
        entity: { not: null },
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const userStats = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const userIds = userStats.map((stat) => stat.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    const userStatsWithDetails = userStats.map((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      return {
        userId: stat.userId,
        userName: user?.fullName || 'Unknown',
        userEmail: user?.email || 'Unknown',
        activityCount: stat._count.id,
      };
    });

    return {
      period: `Last ${days} days`,
      actionStats,
      entityStats,
      topUsers: userStatsWithDetails,
    };
  }

  async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const [deletedActivityLogs, deletedMasterLogs] = await Promise.all([
      this.prisma.activityLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      }),
      this.prisma.masterActivityLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      }),
    ]);

    return {
      deletedActivityLogs: deletedActivityLogs.count,
      deletedMasterLogs: deletedMasterLogs.count,
      cutoffDate,
    };
  }
}
