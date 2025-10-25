import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrCodeDto } from '../auth/dto/create-qrcode.dto';

type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  STARTER: 100,
  PRO: 500,
  ENTERPRISE: 2000,
};

@Injectable()
export class QrCodeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQrCodeDto, tenantId: string) {
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

    const plan = tenant.subscriptionPlan as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan] ?? 0;
    if (currentQrCount >= limit) {
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

    return newQrCode;
  }
  async findAll(tenantId: string) {
    return this.prisma.qRCode.findMany({
      where: { tenantId: tenantId },
    });
  }
}
