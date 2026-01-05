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

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) { }

  // --- CREATE TASK ---
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

    // 1. Validate Project
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found or access denied');

    // 2. Validate Assignee (if provided)
    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, tenantId },
      });
      if (!assignee) throw new NotFoundException('Assignee not found in this tenant');
    }

    // 3. Create Task
    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        projectId,
        creatorId: userId,
        assigneeId: assigneeId || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'MEDIUM',
        tags: tags ? JSON.stringify(tags) : null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        tenantId,
        status: assigneeId ? 'IN_PROGRESS' : 'PENDING', // Auto set status if assigned
      },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, fullName: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
      },
    });

    // 4. Log Audit
    await this.auditService.logActivity(
      userId,
      tenantId,
      'CREATE_TASK',
      { taskId: task.id, title: task.title },
      'TASK',
      task.id,
    );

    // 5. Send Notification if assigned
    if (task.assigneeId && task.creatorId !== task.assigneeId) {
      const assignee = await this.prisma.user.findUnique({ where: { id: task.assigneeId } });
      const assigner = await this.prisma.user.findUnique({ where: { id: userId } });

      if (assignee && assigner) {
        await this.notificationService.sendTaskAssignedNotification(assignee, task, assigner);
      }
    }
    return task;
  }

  // --- FIND ALL (List & Filter) ---
  async findAll(tenantId: string, filters: any) {
    const { projectId, assigneeId, status, search, page = 1, limit = 20 } = filters;

    // Build Dynamic Where Clause
    const where: Prisma.TaskWhereInput = { tenantId };

    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search } }, // Case-insensitive in some DBs
        { description: { contains: search } }
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
          project: { select: { id: true, name: true } },
          creator: { select: { id: true, fullName: true } }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks, // Return standard pagination format
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  // --- GET ONE ---
  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        attachments: true,
        comments: {
          include: { user: { select: { id: true, fullName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }
        },
        assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true } }
      }
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // --- ACCEPT TASK (Self-Assign) ---
  async acceptTask(taskId: string, tenantId: string, userId: string) {
    // 1. Get Task
    const task = await this.prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId) throw new BadRequestException('Task already assigned to someone else');

    // 2. Get User & Role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!user) throw new NotFoundException('User not found');

    // 3. Check Role Restriction (Optional: If task has tag "Role:Manager")
    let requiredRoleName = '';
    if (task.tags) {
      try {
        const tags = JSON.parse(task.tags); // Assuming tags is JSON string array
        if (Array.isArray(tags)) {
          const roleTag = tags.find((t: string) => t.startsWith('Role:'));
          if (roleTag) requiredRoleName = roleTag.split(':')[1];
        }
      } catch (e) { /* ignore parse error */ }
    }

    if (requiredRoleName && (!user.role || user.role.name !== requiredRoleName) && !user.isTenantAdmin) {
      throw new ForbiddenException(`Task requires role: ${requiredRoleName}`);
    }

    // 4. Update Task
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: userId,
        status: 'IN_PROGRESS',
        // actualHours: 0, // Reset tracking if needed
      },
      include: { assignee: true }
    });

    // 5. Sync with Incident (if this task was created from an incident)
    await this.prisma.incident.updateMany({
      where: { taskId },
      data: { status: 'IN_PROGRESS' }
    });

    // 6. Notify Creator
    if (task.creatorId !== userId) {
      await this.notificationService.notifyUser(
        task.creatorId,
        tenantId,
        'Công việc được tiếp nhận',
        `${user.fullName} đã nhận task: "${task.title}"`,
        'SUCCESS'
      );
    }

    // 7. Audit
    await this.auditService.logActivity(userId, tenantId, 'ACCEPT_TASK', { taskId }, 'TASK', taskId);

    return updatedTask;
  }

  // --- UPDATE TASK ---
  async update(id: string, updateTaskDto: UpdateTaskDto, tenantId: string, userId: string) {
    const task = await this.findOne(id, tenantId);

    // Check Permission: Creator, Assignee, or Tenant Admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const canEdit = task.creatorId === userId || task.assigneeId === userId || user?.isTenantAdmin;

    if (!canEdit) throw new ForbiddenException('You do not have permission to edit this task');

    const data: Prisma.TaskUpdateInput = {
      ...updateTaskDto,
      deadline: updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : undefined,
      tags: updateTaskDto.tags ? JSON.stringify(updateTaskDto.tags) : undefined,
    };

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: data,
      include: { assignee: true }
    });

    await this.auditService.logActivity(userId, tenantId, 'UPDATE_TASK', { taskId: id, updates: Object.keys(updateTaskDto) }, 'TASK', id);
    return updatedTask;
  }

  // --- ASSIGN TASK (Manager assigns to someone) ---
  async assignTask(taskId: string, assigneeId: string, tenantId: string, userId: string) {
    const task = await this.findOne(taskId, tenantId);

    // Lấy thông tin người thực hiện thao tác (Assigner)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Kiểm tra user tồn tại trước khi check quyền
    if (!user) {
      throw new NotFoundException('Assigner user not found');
    }

    // Only Creator or Admin can assign
    if (task.creatorId !== userId && !user.isTenantAdmin) {
      throw new ForbiddenException('Only creator or admin can assign tasks');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId,
        status: 'IN_PROGRESS' // Auto switch status
      },
      include: { assignee: true }
    });

    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });

    if (assignee) {
      await this.notificationService.sendTaskAssignedNotification(assignee, updatedTask, user);
    }

    return updatedTask;
  }
  // --- COMMENTS & ATTACHMENTS ---
  async addComment(taskId: string, dto: CreateTaskCommentDto, tenantId: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.taskComment.create({
      data: { content: dto.content, taskId, userId, tenantId },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });
  }

  async addAttachment(taskId: string, dto: CreateTaskAttachmentDto, tenantId: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.taskAttachment.create({
      data: { ...dto, taskId, userId, tenantId },
    });
  }

  async addTimeEntry(taskId: string, dto: TimeTrackingDto, tenantId: string, userId: string) {
    return this.prisma.taskTimeEntry.create({
      data: {
        taskId, userId, tenantId,
        description: dto.description,
        duration: Number(dto.duration),
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
      },
      include: { user: { select: { fullName: true } } }
    });
  }

  // --- STATS ---
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

  // --- DELETE ---
  async remove(id: string, tenantId: string, userId: string) {
    const task = await this.findOne(id, tenantId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Strict delete policy: Only Admin or Creator
    if (task.creatorId !== userId && !user?.isTenantAdmin) {
      throw new ForbiddenException('Cannot delete task created by others');
    }

    // Unlink incidents before delete to avoid constraint error
    await this.prisma.incident.updateMany({
      where: { taskId: id },
      data: { taskId: null, status: 'OPEN' } // Re-open incident if task is deleted
    });

    await this.prisma.task.delete({ where: { id } });

    await this.auditService.logActivity(userId, tenantId, 'DELETE_TASK', { taskId: id, title: task.title }, 'TASK', id);

    return { message: 'Task deleted successfully', id };
  }
}