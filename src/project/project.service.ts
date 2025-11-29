import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuditService } from '../audit/audit.service';
import {
  projectWithDetailsArgs,
  projectWithCountsArgs,
  ProjectResponse,
  DeleteResult,
} from './project.types';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  private mapToResponse(project: any): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      address: project.address,
      status: project.status,
      image: project.image,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      tenantId: project.tenantId,
      qrCount: project._count?.qrcodes || 0,
      taskCount: project._count?.tasks || 0,
      staffCount: project._count?.members || 0,
      qrcodes: project.qrcodes,
      tasks: project.tasks
    };
  }

  async create(
    dto: CreateProjectDto,
    tenantId: string,
    creatorId: string,
  ): Promise<ProjectResponse> {
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        status: dto.status || 'active',
        image: dto.image,
        tenantId: tenantId,
      },
      include: {
        _count: { select: { qrcodes: true, tasks: true, members: true } }
      }
    });

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_PROJECT',
      { projectId: newProject.id, projectName: newProject.name },
      'PROJECT',
      newProject.id,
    );

    return this.mapToResponse(newProject);
  }

  async findAll(tenantId: string): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      where: { tenantId: tenantId },
      ...projectWithCountsArgs,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map(p => this.mapToResponse(p));
  }

  async findOne(id: string, tenantId: string): Promise<ProjectResponse> {
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

    return this.mapToResponse(project);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string,
    actorId: string,
  ): Promise<ProjectResponse> {
    const existingProject = await this.prisma.project.findFirst({
      where: { id: id, tenantId: tenantId },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: id },
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        status: dto.status,
        image: dto.image,
      },
      include: {
        _count: { select: { qrcodes: true, tasks: true, members: true } }
      }
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_PROJECT',
      { projectId: updatedProject.id, changes: dto },
      'PROJECT',
      updatedProject.id,
    );

    return this.mapToResponse(updatedProject);
  }

  async delete(
    id: string,
    tenantId: string,
    actorId: string,
  ): Promise<DeleteResult> {
    const existingProject = await this.prisma.project.findFirst({
      where: { id: id, tenantId: tenantId },
      include: {
        _count: { select: { qrcodes: true, tasks: true, members: true } },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied.');
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