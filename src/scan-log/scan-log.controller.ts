import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScanLogService } from './scan-log.service';
import { CreateScanLogDto } from './dto/create-scan-log.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Permissions } from '../role/decorators/permissions.decorator';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permission } from '../role/constants/permissions.constant';

@Controller('scan-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScanLogController {
  constructor(private readonly scanLogService: ScanLogService) {}

  @Post()
  @Permissions(Permission.SCAN_QRCODE, Permission.CREATE_SCAN_LOG)
  async create(
    @Body() createScanLogDto: CreateScanLogDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.scanLogService.create(createScanLogDto, userId, tenantId);
  }

  @Get()
  @Permissions(Permission.VIEW_SCAN_LOGS, Permission.MANAGE_SCAN_LOGS)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('qrCodeId') qrCodeId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.scanLogService.findAll(tenantId, qrCodeId, userId, startDate, endDate);
  }

  @Get('my-scans')
  @Permissions(Permission.VIEW_SCAN_LOGS)
  async getMyScanLogs(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.scanLogService.getMyScanLogs(userId, tenantId, startDate, endDate);
  }

  @Get('statistics')
  @Permissions(Permission.VIEW_SCAN_LOGS, Permission.VIEW_ANALYTICS)
  async getStatistics(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.scanLogService.getStatistics(tenantId, startDate, endDate);
  }

  @Get('qrcode/:qrCodeId/history')
  @Permissions(Permission.VIEW_SCAN_LOGS, Permission.MANAGE_SCAN_LOGS)
  async getQrCodeScanHistory(
    @Param('qrCodeId') qrCodeId: string,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    return this.scanLogService.getQrCodeScanHistory(qrCodeId, tenantId);
  }

  @Get(':id')
  @Permissions(Permission.VIEW_SCAN_LOGS, Permission.MANAGE_SCAN_LOGS)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.scanLogService.findOne(id, tenantId);
  }
}
