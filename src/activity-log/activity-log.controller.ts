import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityLogService, ActivityAction } from './activity-log.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Permissions } from '../role/decorators/permissions.decorator';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permission } from '../role/constants/permissions.constant';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Permissions(Permission.VIEW_ACTIVITY_LOGS)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('userId') userId?: string,
    @Query('action') action?: ActivityAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.activityLogService.findAll(
      tenantId,
      userId,
      action,
      startDate,
      endDate,
      limitNum,
    );
  }

  @Get('my-history')
  async getMyActivityHistory(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.getUserActivityHistory(
      userId,
      tenantId,
      startDate,
      endDate,
      limitNum,
    );
  }

  @Get('user/:userId')
  @Permissions(Permission.VIEW_ACTIVITY_LOGS)
  async getUserActivityHistory(
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.getUserActivityHistory(
      userId,
      tenantId,
      startDate,
      endDate,
      limitNum,
    );
  }

  @Get('statistics')
  @Permissions(Permission.VIEW_ACTIVITY_LOGS, Permission.VIEW_ANALYTICS)
  async getStatistics(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.activityLogService.getStatistics(tenantId, startDate, endDate);
  }

  @Get('search')
  @Permissions(Permission.VIEW_ACTIVITY_LOGS)
  async searchActivities(
    @Request() req: RequestWithUser,
    @Query('q') searchTerm: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.searchActivities(tenantId, searchTerm, limitNum);
  }
}
