import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Permissions } from '../role/decorators/permissions.decorator';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permission } from '../role/constants/permissions.constant';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrentPlan(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.subscriptionService.getCurrentPlan(tenantId);
  }

  @Get('plans')
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Post('upgrade')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.MANAGE_TENANT_SETTINGS)
  async upgradePlan(
    @Body() upgradePlanDto: UpgradePlanDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.subscriptionService.upgradePlan(tenantId, upgradePlanDto, userId);
  }

  @Post('renew')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.MANAGE_TENANT_SETTINGS)
  async renewSubscription(
    @Request() req: RequestWithUser,
    @Query('months') months?: string,
  ) {
    const tenantId = req.user.tenantId;
    const monthsNum = months ? parseInt(months, 10) : 1;
    return this.subscriptionService.renewSubscription(tenantId, monthsNum);
  }

  @Get('check-limit/:type')
  async checkLimit(
    @Param('type') type: 'qrCodes' | 'users' | 'projects',
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    return this.subscriptionService.checkLimit(tenantId, type);
  }

  @Get('payment-history')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.VIEW_TENANT_SETTINGS)
  async getPaymentHistory(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.subscriptionService.getPaymentHistory(tenantId);
  }
}
