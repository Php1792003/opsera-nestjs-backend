import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { SubscriptionPlan, getPlanLimits, checkPlanLimit } from './constants/subscription-plans.constant';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getCurrentPlan(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        isActive: true,
        _count: {
          select: {
            users: true,
            projects: true,
            qrcodes: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const plan = tenant.subscriptionPlan as SubscriptionPlan;
    const limits = getPlanLimits(plan);

    const daysRemaining = tenant.subscriptionExpiresAt
      ? Math.ceil((tenant.subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        isActive: tenant.isActive,
      },
      currentPlan: plan,
      limits: limits,
      usage: {
        qrCodes: tenant._count.qrcodes,
        users: tenant._count.users,
        projects: tenant._count.projects,
      },
      subscription: {
        expiresAt: tenant.subscriptionExpiresAt,
        daysRemaining: daysRemaining,
        isExpired: daysRemaining !== null && daysRemaining <= 0,
      },
    };
  }

  async upgradePlan(tenantId: string, dto: UpgradePlanDto, userId: string) {
    // Kiểm tra tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const currentPlan = tenant.subscriptionPlan as SubscriptionPlan;
    const newPlan = dto.newPlan;

    // Validate upgrade (không downgrade được qua API này)
    if (this.comparePlans(newPlan, currentPlan) <= 0) {
      throw new BadRequestException('You can only upgrade to a higher plan. For downgrades, please contact support.');
    }

    const newLimits = getPlanLimits(newPlan);
    const newExpiresAt = new Date();
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1); // Add 1 month

    // Update tenant subscription
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlan: newPlan,
        subscriptionExpiresAt: newExpiresAt,
        isActive: true,
      },
    });

    // TODO: Create payment record in database
    // TODO: Integrate with payment gateway (MoMo, Visa, etc.)

    return {
      message: `Successfully upgraded to ${newPlan} plan`,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
      },
      previousPlan: currentPlan,
      newPlan: newPlan,
      newLimits: newLimits,
      expiresAt: newExpiresAt,
      paymentMethod: dto.paymentMethod,
      transactionId: dto.transactionId,
    };
  }

  async checkLimit(tenantId: string, type: 'qrCodes' | 'users' | 'projects'): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    plan: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionPlan: true,
        _count: {
          select: {
            users: type === 'users',
            projects: type === 'projects',
            qrcodes: type === 'qrCodes',
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const plan = tenant.subscriptionPlan as SubscriptionPlan;
    const limits = getPlanLimits(plan);
    
    let current = 0;
    if (type === 'users') current = tenant._count.users;
    else if (type === 'projects') current = tenant._count.projects;
    else if (type === 'qrCodes') current = tenant._count.qrcodes;

    const limit = limits[type];
    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      plan: plan,
    };
  }

  async getAllPlans() {
    return {
      plans: [
        {
          name: SubscriptionPlan.STARTER,
          ...getPlanLimits(SubscriptionPlan.STARTER),
          features: [
            '100 QR Codes',
            '5 Users',
            '3 Projects',
            '1GB Storage',
            'Basic Support',
            'Mobile & Web Access',
          ],
        },
        {
          name: SubscriptionPlan.PRO,
          ...getPlanLimits(SubscriptionPlan.PRO),
          features: [
            '500 QR Codes',
            '20 Users',
            '15 Projects',
            '5GB Storage',
            'Priority Support',
            'Mobile & Web Access',
            'Advanced Analytics',
            'Custom Reports',
          ],
          recommended: true,
        },
        {
          name: SubscriptionPlan.ENTERPRISE,
          ...getPlanLimits(SubscriptionPlan.ENTERPRISE),
          features: [
            '2000 QR Codes',
            'Unlimited Users',
            'Unlimited Projects',
            '20GB Storage',
            '24/7 Premium Support',
            'Mobile & Web Access',
            'Advanced Analytics',
            'Custom Reports',
            'API Access',
            'Custom Integration',
            'Dedicated Account Manager',
          ],
        },
      ],
    };
  }

  async getPaymentHistory(tenantId: string) {
    // TODO: Implement payment history from database
    // For now, return placeholder
    return {
      message: 'Payment history will be implemented with payment gateway integration',
      tenantId: tenantId,
      payments: [],
    };
  }

  async renewSubscription(tenantId: string, months: number = 1) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const currentExpiresAt = tenant.subscriptionExpiresAt || new Date();
    const newExpiresAt = new Date(currentExpiresAt);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionExpiresAt: newExpiresAt,
        isActive: true,
      },
    });

    const plan = tenant.subscriptionPlan as SubscriptionPlan;
    const limits = getPlanLimits(plan);
    const totalCost = limits.pricePerMonth * months;

    return {
      message: `Subscription renewed for ${months} month(s)`,
      plan: plan,
      expiresAt: newExpiresAt,
      totalCost: totalCost,
    };
  }

  // Helper: Compare plans (returns -1, 0, 1)
  private comparePlans(plan1: SubscriptionPlan, plan2: SubscriptionPlan): number {
    const planOrder = [SubscriptionPlan.STARTER, SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE];
    const index1 = planOrder.indexOf(plan1);
    const index2 = planOrder.indexOf(plan2);
    return index1 - index2;
  }
}
