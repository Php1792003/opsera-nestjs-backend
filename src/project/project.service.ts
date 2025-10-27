import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto';
import { UpdateProjectDto } from '../auth/dto/update-project.dto';
import {
  Project,
  ProjectWithDetails,
  DeleteResult,
} from '../types/prisma.types';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, tenantId: string): Promise<Project> {
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        tenantId: tenantId,
      },
    });

    return newProject as Project;
  }

  async findAll(tenantId: string): Promise<Project[]> {
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
    }) as Project[];
  }

  async findOne(id: string, tenantId: string): Promise<ProjectWithDetails> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            qrcodes: true,
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied.');
    }

    return project as ProjectWithDetails;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string,
  ): Promise<Project> {
    // Kiểm tra project có tồn tại và thuộc tenant không
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description || null }),
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

    return updatedProject as Project;
  }

  async delete(id: string, tenantId: string): Promise<DeleteResult> {
    // Kiểm tra project có tồn tại và thuộc tenant không
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

    // Kiểm tra xem có QR codes hoặc tasks không
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
