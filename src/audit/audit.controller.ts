import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('my-activities')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  getUserActivityLogs(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.auditService.getActivityLogs(tenantId, {
      userId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('tenant-activities')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  getTenantActivityLogs(
    @Request() req: RequestWithUser, // <-- SỬA Ở ĐÂY
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { tenantId } = req.user; // Dòng này sẽ hết lỗi
    return this.auditService.getActivityLogs(tenantId, {
      userId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('master-activities')
  @Permissions(Permission.VIEW_MASTER_AUDIT_LOGS)
  getMasterActivityLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('masterAdminId') masterAdminId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getMasterActivityLogs({
      masterAdminId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('stats')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  getActivityStats(
    @Request() req: RequestWithUser,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const { tenantId } = req.user;
    return this.auditService.getActivityStats(tenantId, days);
  }

  @Get('cleanup')
  @Permissions(Permission.MANAGE_SYSTEM)
  cleanupOldLogs(
    @Query('daysToKeep', new DefaultValuePipe(90), ParseIntPipe)
    daysToKeep: number,
  ) {
    return this.auditService.cleanupOldLogs(daysToKeep);
  }
}
