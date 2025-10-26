import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeDto } from '../auth/dto/create-qrcode.dto';
import { UpdateQrCodeDto } from '../auth/dto/update-qrcode.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class QrCodeService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(dto: CreateQrCodeDto, tenantId: string, userId: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true, maxQRCodes: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    const currentQrCount = await this.prisma.qRCode.count({
      where: { tenantId: tenantId },
    });

    const limit = tenant.maxQRCodes;
    if (limit !== -1 && currentQrCount >= limit) {
      throw new ForbiddenException(
        `QR code limit reached for your plan (${limit}). Please upgrade.`,
      );
    }

    const newQrCode = await this.prisma.qRCode.create({
      data: {
        name: dto.name,
        location: dto.location,
        projectId: dto.projectId,
        tenantId: tenantId,
      },
    });

    // Ghi log hoạt động
    await this.auditService.logActivity(
      userId,
      tenantId,
      'CREATE_QR_CODE',
      { qrCodeId: newQrCode.id, qrCodeName: newQrCode.name },
      'QR_CODE',
      newQrCode.id
    );

    return newQrCode;
  }

  async findAll(tenantId: string): Promise<any> {
    return this.prisma.qRCode.findMany({
      where: { tenantId: tenantId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    return qrCode;
  }

  async update(
    id: string,
    dto: UpdateQrCodeDto,
    tenantId: string,
  ): Promise<any> {
    // Kiểm tra QR code có tồn tại và thuộc tenant không

    const existingQrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingQrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    if (dto.projectId && dto.projectId !== existingQrCode.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: dto.projectId,
          tenantId: tenantId,
        },
      });

      if (!project) {
        throw new ForbiddenException('Project not found or access denied.');
      }
    }

    const updatedQrCode = await this.prisma.qRCode.update({
      where: { id: id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.projectId && { projectId: dto.projectId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedQrCode;
  }

  async delete(id: string, tenantId: string): Promise<any> {
    // Kiểm tra QR code có tồn tại và thuộc tenant không

    const existingQrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingQrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    await this.prisma.qRCode.delete({
      where: { id: id },
    });

    return { message: 'QR code deleted successfully', id: id };
  }
}
