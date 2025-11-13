// src/project/project.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto';
import { UpdateProjectDto } from '../auth/dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Project } from '@prisma/client';
import {
  ProjectWithCounts,
  ProjectWithDetails,
  DeleteResult,
} from './project.types';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<Project> {
    const { tenantId, userId } = req.user;
    return this.projectService.create(createProjectDto, tenantId, userId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser): Promise<ProjectWithCounts[]> {
    const { tenantId } = req.user;
    return this.projectService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProjectWithDetails> {
    const { tenantId } = req.user;
    // === SỬA LỖI Ở ĐÂY ===
    // Gọi đúng hàm `findOne` đã có trong service
    return this.projectService.findOne(id, tenantId); 
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<ProjectWithCounts> {
    const { tenantId, userId } = req.user;
    return this.projectService.update(id, updateProjectDto, tenantId, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<DeleteResult> {
    const { tenantId, userId } = req.user;
    return this.projectService.delete(id, tenantId, userId);
  }
}