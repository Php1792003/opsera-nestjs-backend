import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto'; // Import đúng
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post()
  create(@Body() dto: CreateTaskDto, @Request() req: RequestWithUser) {
    return this.taskService.create(dto, req.user.tenantId, req.user.userId);
  }

  @Get()
  findAll(@Request() req: RequestWithUser, @Query() filters: any) {
    return this.taskService.findAll(req.user.tenantId, filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.taskService.findOne(id, req.user.tenantId);
  }

  // API CẬP NHẬT TASK
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto, // DTO đã fix Transform
    @Request() req: RequestWithUser
  ) {
    return this.taskService.update(id, dto, req.user.tenantId, req.user.userId);
  }

  @Put(':id/accept')
  accept(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.taskService.acceptTask(id, req.user.tenantId, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.taskService.remove(id, req.user.tenantId, req.user.userId);
  }
}