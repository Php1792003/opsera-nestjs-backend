import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, TaskStatus } from './dto/update-task.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Permissions } from '../role/decorators/permissions.decorator';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permission } from '../role/constants/permissions.constant';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Permissions(Permission.CREATE_TASK, Permission.MANAGE_TASK)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    const creatorId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.taskService.create(createTaskDto, creatorId, tenantId);
  }

  @Get()
  @Permissions(Permission.READ_TASK, Permission.MANAGE_TASK)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    const tenantId = req.user.tenantId;
    return this.taskService.findAll(tenantId, userId, projectId, status);
  }

  @Get('my-tasks')
  @Permissions(Permission.READ_TASK, Permission.MANAGE_TASK)
  async getMyTasks(
    @Request() req: RequestWithUser,
    @Query('status') status?: TaskStatus,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.taskService.getMyTasks(userId, tenantId, status);
  }

  @Get(':id')
  @Permissions(Permission.READ_TASK, Permission.MANAGE_TASK)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.taskService.findOne(id, tenantId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_TASK, Permission.MANAGE_TASK)
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.taskService.update(id, updateTaskDto, tenantId, userId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_TASK, Permission.MANAGE_TASK)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.taskService.delete(id, tenantId);
  }

  @Patch(':id/assign')
  @Permissions(Permission.ASSIGN_TASK, Permission.MANAGE_TASK)
  async assignTask(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    return this.taskService.assignTask(id, assigneeId, tenantId);
  }

  @Patch(':id/complete')
  @Permissions(Permission.COMPLETE_TASK, Permission.MANAGE_TASK)
  async completeTask(@Param('id') id: string, @Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.taskService.completeTask(id, tenantId, userId);
  }
}
