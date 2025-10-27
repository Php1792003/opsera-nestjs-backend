import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { TimeTrackingDto } from './dto/time-tracking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

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

    // Verify project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Verify assignee exists if provided
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
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
      },
    });

    return task;
  }

  findAll(tenantId: string, filters: any) {
    // TODO: Implement task listing logic
    return { message: 'Tasks retrieved successfully', data: [] };
  }

  findAllByProject(projectId: string, tenantId: string) {
    // TODO: Implement project-specific task listing logic
    return { message: 'Project tasks retrieved successfully', data: [] };
  }

  getMyTasks(tenantId: string, userId: string, filters: any) {
    // TODO: Implement user-specific task listing logic
    return { message: 'My tasks retrieved successfully', data: [] };
  }

  getTaskStats(tenantId: string, projectId?: string) {
    // TODO: Implement task statistics logic
    return { message: 'Task stats retrieved successfully', data: {} };
  }

  findOne(id: string, tenantId: string) {
    // TODO: Implement single task retrieval logic
    return { message: 'Task retrieved successfully', data: { id } };
  }

  update(id: string, updateTaskDto: UpdateTaskDto, tenantId: string, userId: string) {
    // TODO: Implement task update logic
    return { message: 'Task updated successfully', data: { id, ...updateTaskDto } };
  }

  assignTask(id: string, assigneeId: string, tenantId: string, userId: string) {
    // TODO: Implement task assignment logic
    return { message: 'Task assigned successfully', data: { id, assigneeId } };
  }

  addComment(id: string, createCommentDto: CreateTaskCommentDto, tenantId: string, userId: string) {
    // TODO: Implement comment addition logic
    return { message: 'Comment added successfully', data: { id, ...createCommentDto } };
  }

  addAttachment(id: string, createAttachmentDto: CreateTaskAttachmentDto, tenantId: string, userId: string) {
    // TODO: Implement attachment addition logic
    return { message: 'Attachment added successfully', data: { id, ...createAttachmentDto } };
  }

  addTimeEntry(id: string, timeTrackingDto: TimeTrackingDto, tenantId: string, userId: string) {
    // TODO: Implement time entry addition logic
    return { message: 'Time entry added successfully', data: { id, ...timeTrackingDto } };
  }

  remove(id: string, tenantId: string, userId: string) {
    // TODO: Implement task deletion logic
    return { message: 'Task deleted successfully', data: { id } };
  }
}
