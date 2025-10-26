import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeDto } from '../auth/dto/create-qrcode.dto';
import { UpdateQrCodeDto } from '../auth/dto/update-qrcode.dto';

type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  STARTER: 100,
  PRO: 500,
  ENTERPRISE: 2000,
};

@Injectable()
export class QrCodeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQrCodeDto, tenantId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const currentQrCount = await this.prisma.qRCode.count({
      where: { tenantId: tenantId },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const plan = tenant.subscriptionPlan as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan] ?? 0;
    if (currentQrCount >= limit) {
      throw new ForbiddenException(
        `QR code limit reached for your plan (${limit}). Please upgrade.`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const newQrCode = await this.prisma.qRCode.create({
      data: {
        name: dto.name,
        location: dto.location,
        projectId: dto.projectId,
        tenantId: tenantId,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return newQrCode;
  }

  async findAll(tenantId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return qrCode;
  }

  async update(id: string, dto: UpdateQrCodeDto, tenantId: string): Promise<any> {
    // Kiểm tra QR code có tồn tại và thuộc tenant không
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existingQrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingQrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.projectId && dto.projectId !== existingQrCode.projectId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return updatedQrCode;
  }

  async delete(id: string, tenantId: string): Promise<any> {
    // Kiểm tra QR code có tồn tại và thuộc tenant không
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existingQrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });

    if (!existingQrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.qRCode.delete({
      where: { id: id },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { message: 'QR code deleted successfully', id: id };
  }
}
