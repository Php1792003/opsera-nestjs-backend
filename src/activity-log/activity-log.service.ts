import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum ActivityAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // Role actions
  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',

  // Project actions
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',

  // QR Code actions
  QRCODE_CREATE = 'QRCODE_CREATE',
  QRCODE_UPDATE = 'QRCODE_UPDATE',
  QRCODE_DELETE = 'QRCODE_DELETE',
  QRCODE_SCAN = 'QRCODE_SCAN',

  // Task actions
  TASK_CREATE = 'TASK_CREATE',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_COMPLETE = 'TASK_COMPLETE',

  // Tenant actions
  TENANT_UPDATE_SETTINGS = 'TENANT_UPDATE_SETTINGS',
  TENANT_UPGRADE_PLAN = 'TENANT_UPGRADE_PLAN',
  TENANT_DOWNGRADE_PLAN = 'TENANT_DOWNGRADE_PLAN',
}

interface ActivityDetails {
  [key: string]: any;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: ActivityAction,
    userId: string,
    tenantId: string,
    details?: ActivityDetails,
  ) {
    try {
      const detailsStr = details ? JSON.stringify(details) : null;

      await this.prisma.activityLog.create({
        data: {
          action: action,
          userId: userId,
          tenantId: tenantId,
          details: detailsStr,
        },
      });
    } catch (error) {
      // Log error but don't throw - activity logging shouldn't break main flow
      console.error('Failed to create activity log:', error);
    }
  }

  async findAll(
    tenantId: string,
    userId?: string,
    action?: ActivityAction,
    startDate?: string,
    endDate?: string,
    limit: number = 100,
  ) {
    const where: any = { tenantId: tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const activityLogs = await this.prisma.activityLog.findMany({
      where: where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activityLogs.map(log => this.formatActivityLogResponse(log));
  }

  async getUserActivityHistory(
    userId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50,
  ) {
    const where: any = {
      userId: userId,
      tenantId: tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const activityLogs = await this.prisma.activityLog.findMany({
      where: where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activityLogs.map(log => this.formatActivityLogResponse(log));
  }

  async getStatistics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId: tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Count total activities
    const totalActivities = await this.prisma.activityLog.count({ where });

    // Count by action type
    const actionCounts = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where: where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    // Most active users
    const mostActiveUsers = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where: where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details
    const userIds = mostActiveUsers.map(item => item.userId);
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const mostActiveUsersWithDetails = mostActiveUsers.map(item => {
      const user = users.find(u => u.id === item.userId);
      return {
        user: user,
        activityCount: item._count.userId,
      };
    });

    // Recent activities (last 10)
    const recentActivities = await this.prisma.activityLog.findMany({
      where: where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return {
      totalActivities: totalActivities,
      actionBreakdown: actionCounts,
      mostActiveUsers: mostActiveUsersWithDetails,
      recentActivities: recentActivities.map(log => this.formatActivityLogResponse(log)),
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now',
      },
    };
  }

  async searchActivities(
    tenantId: string,
    searchTerm: string,
    limit: number = 50,
  ) {
    // Search in action and details
    const activityLogs = await this.prisma.activityLog.findMany({
      where: {
        tenantId: tenantId,
        OR: [
          {
            action: {
              contains: searchTerm,
            },
          },
          {
            details: {
              contains: searchTerm,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activityLogs.map(log => this.formatActivityLogResponse(log));
  }

  // Helper method để format response
  private formatActivityLogResponse(log: any) {
    return {
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    };
  }
}
