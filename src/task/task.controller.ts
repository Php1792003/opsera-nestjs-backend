// src/task/task.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { TimeTrackingDto } from './dto/time-tracking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Permissions(Permission.CREATE_TASK)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.create(createTaskDto, tenantId, userId);
  }

  @Get()
  @Permissions(Permission.READ_TASK)
  findAll(@Request() req: RequestWithUser, @Query() filters: any) {
    // <-- ĐÃ SỬA
    const { tenantId } = req.user;
    return this.taskService.findAll(tenantId, filters);
  }

  @Get('by-project/:projectId')
  @Permissions(Permission.READ_TASK)
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId } = req.user;
    return this.taskService.findAllByProject(projectId, tenantId);
  }

  @Get('my-tasks')
  @Permissions(Permission.READ_TASK)
  getMyTasks(@Request() req: RequestWithUser, @Query() filters: any) {
    const { tenantId, userId } = req.user;
    return this.taskService.getMyTasks(tenantId, userId, filters);
  }

  @Get('stats')
  @Permissions(Permission.READ_TASK)
  getTaskStats(
    @Request() req: RequestWithUser,
    @Query('projectId') projectId?: string,
  ) {
    const { tenantId } = req.user;
    return this.taskService.getTaskStats(tenantId, projectId);
  }

  @Get(':id')
  @Permissions(Permission.READ_TASK)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId } = req.user;
    return this.taskService.findOne(id, tenantId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_TASK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.update(id, updateTaskDto, tenantId, userId);
  }

  @Put(':id/assign')
  @Permissions(Permission.ASSIGN_TASK)
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assigneeId') assigneeId: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.assignTask(id, assigneeId, tenantId, userId);
  }

  @Post(':id/comments')
  @Permissions(Permission.UPDATE_TASK)
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCommentDto: CreateTaskCommentDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.addComment(id, createCommentDto, tenantId, userId);
  }

  @Post(':id/attachments')
  @Permissions(Permission.UPDATE_TASK)
  addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createAttachmentDto: CreateTaskAttachmentDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.addAttachment(
      id,
      createAttachmentDto,
      tenantId,
      userId,
    );
  }

  @Post(':id/time-entries')
  @Permissions(Permission.UPDATE_TASK)
  addTimeEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() timeTrackingDto: TimeTrackingDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.addTimeEntry(id, timeTrackingDto, tenantId, userId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_TASK)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.taskService.remove(id, tenantId, userId);
  }
}
