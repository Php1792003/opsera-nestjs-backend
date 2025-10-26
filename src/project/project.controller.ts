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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto';
import { UpdateProjectDto } from '../auth/dto/update-project.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.projectService.create(createProjectDto, tenantId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser): Promise<any> {
    const tenantId = req.user.tenantId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.projectService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser): Promise<any> {
    const tenantId = req.user.tenantId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.projectService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.projectService.update(id, updateProjectDto, tenantId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: RequestWithUser): Promise<any> {
    const tenantId = req.user.tenantId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.projectService.delete(id, tenantId);
  }
}
