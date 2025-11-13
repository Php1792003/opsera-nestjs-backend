import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) {}

  // Tạo task mới
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

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, tenantId },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found or access denied');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        projectId,
        creatorId: userId,
        assigneeId,
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

    await this.auditService.logActivity(
      userId,
      tenantId,
      'CREATE_TASK',
      {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: assigneeId,
      },
      'TASK',
      task.id,
    );

    if (task.assigneeId && task.creatorId !== task.assigneeId) {
      const [assignee, assigner] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: task.assigneeId } }),
        this.prisma.user.findUnique({ where: { id: userId } }),
      ]);

      if (assignee && assigner) {
        await this.notificationService.sendTaskAssignedNotification(
          assignee,
          task,
          assigner,
        );
      }
    }

    return task;
  }

  // Lấy danh sách tasks
  async findAll(
    tenantId: string,
    filters: {
      projectId?: string;
      assigneeId?: string;
      status?: string;
      priority?: string;
      search?: string;
      page?: number | string;
      limit?: number | string;
    } = {},
  ) {
    const { projectId, assigneeId, status, priority, search } = filters;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    const where: Prisma.TaskWhereInput = { tenantId };

    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          creator: { select: { id: true, email: true, fullName: true } },
          assignee: { select: { id: true, email: true, fullName: true } },
          comments: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
            take: 5,
          },
          timeEntries: {
            include: { user: { select: { id: true, fullName: true } } },
            orderBy: { startTime: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy tasks theo project
  async findAllByProject(projectId: string, tenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return this.prisma.task.findMany({
      where: { projectId, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lấy task theo ID
  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { startTime: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    return task;
  }

  // Cập nhật task
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.findOne(id, tenantId);

    if (task.creatorId !== userId && task.assigneeId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isTenantAdmin: true },
      });

      if (!user?.isTenantAdmin) {
        throw new ForbiddenException(
          'You do not have permission to update this task',
        );
      }
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (updateTaskDto.title !== undefined)
      updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined)
      updateData.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined)
      updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.deadline !== undefined)
      updateData.deadline = updateTaskDto.deadline
        ? new Date(updateTaskDto.deadline)
        : null;
    if (updateTaskDto.tags !== undefined)
      updateData.tags = updateTaskDto.tags
        ? JSON.stringify(updateTaskDto.tags)
        : null;
    if (updateTaskDto.estimatedHours !== undefined)
      updateData.estimatedHours = updateTaskDto.estimatedHours;
    if (updateTaskDto.actualHours !== undefined)
      updateData.actualHours = updateTaskDto.actualHours;
    if (updateTaskDto.notes !== undefined)
      updateData.notes = updateTaskDto.notes;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'UPDATE_TASK',
      {
        taskId: task.id,
        taskTitle: task.title,
        changes: updateTaskDto,
      },
      'TASK',
      task.id,
    );

    return updatedTask;
  }

  // Xóa task
  async remove(id: string, tenantId: string, userId: string) {
    const task = await this.findOne(id, tenantId);

    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isTenantAdmin: true },
      });

      if (!user?.isTenantAdmin) {
        throw new ForbiddenException(
          'You do not have permission to delete this task',
        );
      }
    }

    await this.prisma.task.delete({
      where: { id },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'DELETE_TASK',
      {
        taskId: task.id,
        taskTitle: task.title,
      },
      'TASK',
      task.id,
    );

    return { message: 'Task deleted successfully', id };
  }

  // Lấy tasks của tôi
  async getMyTasks(
    tenantId: string,
    userId: string,
    filters: { status?: string; priority?: string } = {},
  ) {
    const where: Prisma.TaskWhereInput = {
      tenantId,
      OR: [{ creatorId: userId }, { assigneeId: userId }],
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Phân công task
  async assignTask(
    taskId: string,
    assigneeId: string,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.findOne(taskId, tenantId);

    if (task.assigneeId === assigneeId) {
      return task;
    }

    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isTenantAdmin: true },
      });

      if (!user?.isTenantAdmin) {
        throw new ForbiddenException(
          'You do not have permission to assign this task',
        );
      }
    }

    const assignee = await this.prisma.user.findFirst({
      where: { id: assigneeId, tenantId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found or access denied');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
      },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'ASSIGN_TASK',
      {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: assigneeId,
        assigneeName: assignee.fullName,
      },
      'TASK',
      task.id,
    );

    const [assigner] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (assignee && assigner) {
      await this.notificationService.sendTaskAssignedNotification(
        assignee,
        updatedTask,
        assigner,
      );
    }

    return updatedTask;
  }

  async addComment(
    taskId: string,
    createCommentDto: CreateTaskCommentDto,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.findOne(taskId, tenantId);

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        content: createCommentDto.content,
        userId,
        tenantId,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'ADD_TASK_COMMENT',
      {
        taskId: task.id,
        commentId: comment.id,
      },
      'TASK',
      task.id,
    );

    return comment;
  }

  // Thêm attachment vào task
  async addAttachment(
    taskId: string,
    createAttachmentDto: CreateTaskAttachmentDto,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.findOne(taskId, tenantId);

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        fileName: createAttachmentDto.fileName,
        originalName: createAttachmentDto.originalName,
        filePath: createAttachmentDto.filePath,
        mimeType: createAttachmentDto.mimeType,
        size: createAttachmentDto.size,
        userId,
        tenantId,
      },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'ADD_TASK_ATTACHMENT',
      {
        taskId: task.id,
        attachmentId: attachment.id,
        fileName: attachment.originalName,
      },
      'TASK',
      task.id,
    );

    return attachment;
  }

  // Thêm time tracking
  async addTimeEntry(
    taskId: string,
    timeTrackingDto: TimeTrackingDto,
    tenantId: string,
    userId: string,
  ) {
    const task = await this.findOne(taskId, tenantId);

    const timeEntry = await this.prisma.taskTimeEntry.create({
      data: {
        taskId,
        description: timeTrackingDto.description,
        startTime: new Date(timeTrackingDto.startTime),
        endTime: timeTrackingDto.endTime
          ? new Date(timeTrackingDto.endTime)
          : null,
        duration: timeTrackingDto.duration,
        userId,
        tenantId,
      },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    await this.auditService.logActivity(
      userId,
      tenantId,
      'ADD_TASK_TIME_ENTRY',
      {
        taskId: task.id,
        timeEntryId: timeEntry.id,
        duration: timeEntry.duration,
      },
      'TASK',
      task.id,
    );

    return timeEntry;
  }

  // Thống kê task
  async getTaskStats(tenantId: string, projectId?: string) {
    const where: Prisma.TaskWhereInput = { tenantId };
    if (projectId) {
      where.projectId = projectId;
    }

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.task.count({
        where: {
          ...where,
          status: { not: 'COMPLETED' },
          deadline: { lt: new Date() },
        },
      }),
    ]);

    const priorityStats = await this.prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });

    const assigneeStats = await this.prisma.task.groupBy({
      by: ['assigneeId'],
      where: { ...where, assigneeId: { not: null } },
      _count: { id: true },
      _sum: { estimatedHours: true },
    });

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityStats,
      assigneeStats,
    };
  }
}
