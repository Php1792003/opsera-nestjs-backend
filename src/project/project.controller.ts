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
// Import đúng đường dẫn DTO mới tạo
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { ProjectResponse, DeleteResult } from './project.types';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<ProjectResponse> {
    const { tenantId, userId } = req.user;
    return this.projectService.create(createProjectDto, tenantId, userId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser): Promise<ProjectResponse[]> {
    const { tenantId } = req.user;
    return this.projectService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProjectResponse> {
    const { tenantId } = req.user;
    return this.projectService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<ProjectResponse> {
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