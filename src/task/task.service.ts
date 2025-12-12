import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { TimeTrackingDto } from './dto/time-tracking.dto';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) { }

  async create(createTaskDto: CreateTaskDto, tenantId: string, userId: string) {
    const {
      title,
      description,
      projectId,
      assigneeId,
      deadline,
      priority,
      tags,
      estimatedHours,
    } = createTaskDto;

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Kiểm tra assignee nếu có
    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, tenantId },
      });
      if (!assignee) throw new NotFoundException('Assignee not found');
    }

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        projectId,
        creatorId: userId,
        assigneeId: assigneeId || null, // Đảm bảo null nếu undefined
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'MEDIUM',
        tags: tags ? JSON.stringify(tags) : null,
        estimatedHours,
        tenantId,
      },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logActivity(userId, tenantId, 'CREATE_TASK', { taskId: task.id }, 'TASK', task.id);

    if (task.assigneeId && task.creatorId !== task.assigneeId) {
      const assignee = await this.prisma.user.findUnique({ where: { id: task.assigneeId } });
      const assigner = await this.prisma.user.findUnique({ where: { id: userId } });

      if (assignee && assigner) {
        await this.notificationService.sendTaskAssignedNotification(assignee, task, assigner);
      }
    }
    return task;
  }


  async findAll(tenantId: string, filters: any) {
    const { projectId, assigneeId, status, search, page = 1, limit = 20 } = filters;
    const where: Prisma.TaskWhereInput = { tenantId };

    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (search) where.OR = [{ title: { contains: search } }, { description: { contains: search } }];

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
          project: { select: { name: true } },
          creator: { select: { fullName: true } }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total, page, limit, totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        attachments: true,
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        assignee: true,
        creator: true
      }
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async acceptTask(taskId: string, tenantId: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId) throw new BadRequestException('Task already assigned');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check Role trong Tags
    let requiredRoleName = '';
    if (task.tags) {
      try {
        const tags = JSON.parse(task.tags);
        const roleTag = tags.find((t: string) => t.startsWith('Role:'));
        if (roleTag) requiredRoleName = roleTag.split(':')[1];
      } catch (e) { }
    }

    if (requiredRoleName && (!user.role || user.role.name !== requiredRoleName) && !user.isTenantAdmin) {
      throw new ForbiddenException('Bạn không thuộc diện xử lý công việc này.');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: userId, status: 'IN_PROGRESS' },
      include: { assignee: true }
    });

    // Update Incident nếu có
    await this.prisma.incident.updateMany({ where: { taskId }, data: { status: 'IN_PROGRESS' } });

    await this.notificationService.notifyUser(
      task.creatorId,
      tenantId,
      'Công việc được tiếp nhận',
      `Nhân viên ${user.fullName} đã bắt đầu xử lý task: "${task.title}".`,
      'SUCCESS'
    );

    return updated;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, tenantId: string, userId: string) {
    const task = await this.findOne(id, tenantId);

    if (task.creatorId !== userId && task.assigneeId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isTenantAdmin) throw new ForbiddenException('Permission denied');
    }

    const data: Prisma.TaskUpdateInput = {
      ...updateTaskDto,
      deadline: updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : updateTaskDto.deadline,
      tags: updateTaskDto.tags ? JSON.stringify(updateTaskDto.tags) : undefined,
    };

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: data,
      include: { assignee: true }
    });

    await this.auditService.logActivity(userId, tenantId, 'UPDATE_TASK', { taskId: id }, 'TASK', id);
    return updatedTask;
  }

  async assignTask(taskId: string, assigneeId: string, tenantId: string, userId: string) {
    const task = await this.findOne(taskId, tenantId);

    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isTenantAdmin) throw new ForbiddenException('Permission denied');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: { assignee: true }
    });

    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
    const assigner = await this.prisma.user.findUnique({ where: { id: userId } });
    if (assignee && assigner) await this.notificationService.sendTaskAssignedNotification(assignee, updatedTask, assigner);

    return updatedTask;
  }


  async addComment(taskId: string, dto: CreateTaskCommentDto, tenantId: string, userId: string) {
    const comment = await this.prisma.taskComment.create({
      data: { content: dto.content, taskId, userId, tenantId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    return comment;
  }

  async addAttachment(taskId: string, dto: CreateTaskAttachmentDto, tenantId: string, userId: string) {
    return this.prisma.taskAttachment.create({
      data: { ...dto, taskId, userId, tenantId },
    });
  }

  async addTimeEntry(taskId: string, dto: TimeTrackingDto, tenantId: string, userId: string) {
    return this.prisma.taskTimeEntry.create({
      data: {
        taskId, userId, tenantId,
        description: dto.description,
        duration: dto.duration,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
      },
      include: { user: true }
    });
  }

  async getTaskStats(tenantId: string, projectId?: string) {
    const where: Prisma.TaskWhereInput = { tenantId };
    if (projectId) where.projectId = projectId;

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.task.count({ where: { ...where, status: { not: 'COMPLETED' }, deadline: { lt: new Date() } } }),
    ]);

    return { total, pending, inProgress, completed, overdue };
  }

  async getMyTasks(tenantId: string, userId: string, filters: any) {
    return this.prisma.task.findMany({
      where: {
        tenantId,
        OR: [{ assigneeId: userId }, { creatorId: userId }]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllByProject(projectId: string, tenantId: string) {
    return this.prisma.task.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    const task = await this.findOne(id, tenantId);
    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isTenantAdmin) throw new ForbiddenException('Cannot delete task');
    }

    await this.prisma.incident.updateMany({
      where: { taskId: id },
      data: { taskId: null, status: 'OPEN' }
    });

    await this.prisma.task.delete({ where: { id } });
    return { message: 'Deleted', id };
  }
}