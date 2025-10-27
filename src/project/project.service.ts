import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto'; // Đường dẫn này có thể cần sửa lại
import { UpdateProjectDto } from '../auth/dto/update-project.dto'; // Đường dẫn này có thể cần sửa lại
import { Prisma, Project } from '@prisma/client';
import { projectWithCounts } from './projectWithCounts'; // <-- IMPORT TỪ ĐÂY

// Định nghĩa một kiểu dữ liệu phức tạp hơn để sử dụng lại
// Nó sẽ tự động suy ra kiểu trả về từ câu lệnh Prisma
const projectWithDetails = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    qrcodes: {
      select: {
        id: true,
        name: true,
        location: true,
        data: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    tasks: {
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    _count: {
      select: {
        qrcodes: true,
        tasks: true,
      },
    },
  },
});

// Tạo một kiểu TypeScript từ định nghĩa trên
type ProjectWithDetails = Prisma.ProjectGetPayload<typeof projectWithDetails>;

type ProjectWithCounts = Prisma.ProjectGetPayload<typeof projectWithCounts>;

// Kiểu cho kết quả xóa
type DeleteResult = {
  message: string;
  id: string;
};

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, tenantId: string): Promise<Project> {
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        tenantId: tenantId,
      },
    });
    // Không còn lỗi vì kiểu trả về của Prisma khớp với kiểu Project import từ @prisma/client
    return newProject;
  }

  async findAll(tenantId: string): Promise<ProjectWithCounts[]> {
    return this.prisma.project.findMany({
      where: { tenantId: tenantId },
      include: {
        _count: {
          select: {
            qrcodes: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string): Promise<ProjectWithDetails> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      // Sử dụng lại định nghĩa đã tạo ở trên
      include: projectWithDetails.include,
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied.');
    }

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string,
  ): Promise<ProjectWithCounts> {
    const existingProject = await this.prisma.project.findFirst({
      where: { id: id, tenantId: tenantId },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    return this.prisma.project.update({
      where: { id: id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        _count: {
          select: {
            qrcodes: true,
            tasks: true,
          },
        },
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<DeleteResult> {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: {
            qrcodes: true,
            tasks: true,
          },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    if (
      existingProject._count.qrcodes > 0 ||
      existingProject._count.tasks > 0
    ) {
      throw new NotFoundException(
        `Cannot delete project. It has ${existingProject._count.qrcodes} QR code(s) and ${existingProject._count.tasks} task(s). Please delete them first.`,
      );
    }

    await this.prisma.project.delete({
      where: { id: id },
    });

    return { message: 'Project deleted successfully', id: id };
  }
}
