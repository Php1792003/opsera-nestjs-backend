import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from '../auth/dto/create-project.dto';
import { UpdateProjectDto } from '../auth/dto/update-project.dto';
import { AuditService } from '../audit/audit.service';
import { Project } from '@prisma/client';
import {
  projectWithDetailsArgs,
  projectWithCountsArgs,
  ProjectWithDetails,
  ProjectWithCounts,
  DeleteResult,
} from './project.types';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    dto: CreateProjectDto,
    tenantId: string,
    creatorId: string,
  ): Promise<Project> {
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        tenantId: tenantId,
      },
    });

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_PROJECT',
      { projectId: newProject.id, projectName: newProject.name },
      'PROJECT',
      newProject.id,
    );

    return newProject;
  }

  async findAll(tenantId: string): Promise<ProjectWithCounts[]> {
    return this.prisma.project.findMany({
      where: { tenantId: tenantId },
      ...projectWithCountsArgs,
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
      ...projectWithDetailsArgs,
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
    actorId: string,
  ): Promise<ProjectWithCounts> {
    const existingProject = await this.prisma.project.findFirst({
      where: { id: id, tenantId: tenantId },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      ...projectWithCountsArgs,
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_PROJECT',
      { projectId: updatedProject.id, changes: dto },
      'PROJECT',
      updatedProject.id,
    );

    return updatedProject;
  }

  async delete(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<DeleteResult> {
    const existingProject = await this.prisma.project.findFirst({
      where: { id: id, tenantId: tenantId },
      include: { _count: { select: { qrcodes: true, tasks: true, members: true } } },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    if (
      existingProject._count.qrcodes > 0 ||
      existingProject._count.tasks > 0 ||
      existingProject._count.members > 0
    ) {
      throw new NotFoundException(
        `Cannot delete project. It has related items (QR: ${existingProject._count.qrcodes}, Tasks: ${existingProject._count.tasks}, Members: ${existingProject._count.members}). Please remove them first.`,
      );
    }

    await this.prisma.project.delete({
      where: { id: id },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'DELETE_PROJECT',
      { projectId: existingProject.id, projectName: existingProject.name },
      'PROJECT',
      existingProject.id,
    );

    return { message: 'Project deleted successfully', id: id };
  }
}