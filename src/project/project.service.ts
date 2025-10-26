import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto';
import { UpdateProjectDto } from '../auth/dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, tenantId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        tenantId: tenantId,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return newProject;
  }

  async findAll(tenantId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

  async findOne(id: string, tenantId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, tenantId: string): Promise<any> {
    // Kiểm tra project có tồn tại và thuộc tenant không
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const updatedProject = await this.prisma.project.update({
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return updatedProject;
  }

  async delete(id: string, tenantId: string): Promise<any> {
    // Kiểm tra project có tồn tại và thuộc tenant không
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (
      existingProject._count.qrcodes > 0 ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      existingProject._count.tasks > 0
    ) {
      throw new NotFoundException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-member-access
        `Cannot delete project. It has ${existingProject._count.qrcodes} QR code(s) and ${existingProject._count.tasks} task(s). Please delete them first.`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.project.delete({
      where: { id: id },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { message: 'Project deleted successfully', id: id };
  }
}
