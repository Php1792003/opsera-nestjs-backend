import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, TaskStatus } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto, creatorId: string, tenantId: string) {
    // Kiểm tra project có tồn tại và thuộc tenant không
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        tenantId: tenantId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied.');
    }

    // Nếu có assigneeId, kiểm tra user có tồn tại và thuộc tenant không
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: dto.assigneeId,
          tenantId: tenantId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found or not in your organization.');
      }
    }

    const newTask = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        creatorId: creatorId,
        assigneeId: dto.assigneeId,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        tenantId: tenantId,
        status: TaskStatus.PENDING,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return newTask;
  }

  async findAll(tenantId: string, userId?: string, projectId?: string, status?: TaskStatus) {
    const where: any = { tenantId: tenantId };

    // Filter by assignee if userId provided
    if (userId) {
      where.assigneeId = userId;
    }

    // Filter by project if projectId provided
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    const tasks = await this.prisma.task.findMany({
      where: where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks;
  }

  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied.');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, tenantId: string, userId: string) {
    // Kiểm tra task có tồn tại và thuộc tenant không
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found or access denied.');
    }

    // Nếu đổi assignee, kiểm tra user mới có tồn tại và thuộc tenant không
    if (dto.assigneeId && dto.assigneeId !== existingTask.assigneeId) {
      const newAssignee = await this.prisma.user.findFirst({
        where: {
          id: dto.assigneeId,
          tenantId: tenantId,
        },
      });

      if (!newAssignee) {
        throw new NotFoundException('Assignee not found or not in your organization.');
      }
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status) updateData.status = dto.status;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.deadline !== undefined) {
      updateData.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedTask;
  }

  async delete(id: string, tenantId: string) {
    // Kiểm tra task có tồn tại và thuộc tenant không
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found or access denied.');
    }

    await this.prisma.task.delete({
      where: { id: id },
    });

    return { message: 'Task deleted successfully', id: id };
  }

  async getMyTasks(userId: string, tenantId: string, status?: TaskStatus) {
    const where: any = {
      tenantId: tenantId,
      assigneeId: userId,
    };

    if (status) {
      where.status = status;
    }

    const tasks = await this.prisma.task.findMany({
      where: where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return tasks;
  }

  async assignTask(taskId: string, assigneeId: string, tenantId: string) {
    // Kiểm tra task
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied.');
    }

    // Kiểm tra assignee
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: assigneeId,
        tenantId: tenantId,
      },
    });

    if (!assignee) {
      throw new NotFoundException('User not found or not in your organization.');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: assigneeId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedTask;
  }

  async completeTask(taskId: string, tenantId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: tenantId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied.');
    }

    // Chỉ assignee hoặc creator mới có thể complete task
    if (task.assigneeId !== userId && task.creatorId !== userId) {
      throw new ForbiddenException('Only the assignee or creator can complete this task.');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.COMPLETED },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedTask;
  }
}
