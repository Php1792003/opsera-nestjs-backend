import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeDto } from './dto/create-qrcode.dto';
import { UpdateQrCodeDto } from './dto/update-qrcode.dto';
import { AuditService } from '../audit/audit.service';

type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  STARTER: 100,
  PRO: 500,
  ENTERPRISE: 2000,
};

@Injectable()
export class QrCodeService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  async create(dto: CreateQrCodeDto, tenantId: string, creatorId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    const currentQrCount = await this.prisma.qRCode.count({
      where: { tenantId: tenantId },
    });
    const plan = (tenant.subscriptionPlan as SubscriptionPlan) || 'STARTER';
    const limit = PLAN_LIMITS[plan] ?? 100;

    if (currentQrCount >= limit) {
      throw new ForbiddenException(
        `QR code limit reached for your plan (${limit}). Please upgrade.`,
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, tenantId: tenantId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied.');
    }

    // Prisma sẽ tự động sinh trường 'data' bằng cuid() theo schema
    const newQrCode = await this.prisma.qRCode.create({
      data: {
        name: dto.name,
        location: dto.location,
        projectId: dto.projectId,
        tenantId: tenantId,
      },
    });

    await this.auditService.logActivity(
      creatorId,
      tenantId,
      'CREATE_QRCODE',
      {
        qrCodeId: newQrCode.id,
        qrCodeName: newQrCode.name,
        projectId: newQrCode.projectId,
      },
      'QRCODE',
      newQrCode.id,
    );

    return newQrCode;
  }

  async findAll(tenantId: string) {
    return this.prisma.qRCode.findMany({
      where: { tenantId: tenantId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // MỚI: Hàm lấy nhật ký quét (Scan Logs)
  async getRecentScanLogs(tenantId: string) {
    return this.prisma.scanLog.findMany({
      where: { tenantId: tenantId },
      take: 50, // Lấy 50 log mới nhất
      orderBy: { scannedAt: 'desc' },
      include: {
        qrCode: { select: { name: true, location: true, projectId: true } },
        user: { select: { fullName: true } }
      }
    });
  }

  async findOne(id: string, tenantId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id: id, tenantId: tenantId },
      include: {
        project: { select: { id: true, name: true } },
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
    actorId: string,
  ) {
    const existingQrCode = await this.findOne(id, tenantId);

    if (dto.projectId && dto.projectId !== existingQrCode.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, tenantId: tenantId },
      });
      if (!project) {
        throw new ForbiddenException('Project not found or access denied.');
      }
    }

    const updatedQrCode = await this.prisma.qRCode.update({
      where: { id: id },
      data: { ...dto },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'UPDATE_QRCODE',
      { qrCodeId: updatedQrCode.id, changes: dto },
      'QRCODE',
      updatedQrCode.id,
    );

    return updatedQrCode;
  }

  async delete(id: string, tenantId: string, actorId: string) {
    const existingQrCode = await this.findOne(id, tenantId);

    await this.prisma.qRCode.delete({
      where: { id: id },
    });

    await this.auditService.logActivity(
      actorId,
      tenantId,
      'DELETE_QRCODE',
      { qrCodeId: existingQrCode.id, qrCodeName: existingQrCode.name },
      'QRCODE',
      existingQrCode.id,
    );

    return { message: 'QR code deleted successfully', id: id };
  }
}