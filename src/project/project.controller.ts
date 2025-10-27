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

import { Prisma, Project } from '@prisma/client';
import { projectWithDetails } from './projectWithDetails';

type ProjectWithDetails = Prisma.ProjectGetPayload<typeof projectWithDetails>;

export const projectWithCounts = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: { _count: { select: { qrcodes: true, tasks: true } } },
});
type ProjectWithCounts = Prisma.ProjectGetPayload<typeof projectWithCounts>;

// Giả sử bạn có một type RequestWithUser
interface RequestWithUser extends Request {
  user: {
    id: string;
    tenantId: string;
    // các trường khác trong payload JWT
  };
}

@Controller('projects') // Nên đặt tên controller theo resource
@UseGuards(JwtAuthGuard) // Bảo vệ tất cả các route trong controller này
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<Project> {
    const tenantId = req.user.tenantId;
    return this.projectService.create(createProjectDto, tenantId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser): Promise<ProjectWithCounts[]> {
    // <-- ĐÃ SỬA
    const tenantId = req.user.tenantId;
    return this.projectService.findAll(tenantId); // <-- KHÔNG CÒN LỖI
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProjectWithDetails> {
    // <-- ĐÃ SỬA
    const tenantId = req.user.tenantId;
    return this.projectService.findOne(id, tenantId); // <-- KHÔNG CÒN LỖI
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: RequestWithUser,
  ): Promise<ProjectWithCounts> {
    // <-- ĐÃ SỬA
    const tenantId = req.user.tenantId;
    return this.projectService.update(id, updateProjectDto, tenantId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Kiểu trả về cho delete thường là void hoặc một object thông báo
    const tenantId = req.user.tenantId;
    return this.projectService.delete(id, tenantId);
  }
}
