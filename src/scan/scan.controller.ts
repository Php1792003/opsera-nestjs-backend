import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('scans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) { }

  @Post()
  // REMOVED PERMISSION CHECK: Allow all logged-in users to scan
  @Permissions(Permission.SCAN_QR, Permission.CREATE_SCAN_LOG)
  async create(
    @Body() createScanDto: CreateScanDto,
    @Request() req: RequestWithUser,
  ) {
    const { userId, tenantId } = req.user;
    return this.scanService.create(createScanDto, userId, tenantId);
  }

  @Get()
  // Allow viewing logs (might restrict to managers in future, currently open for demo)
  @Permissions(Permission.VIEW_SCAN_LOGS)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const { tenantId } = req.user;
    return this.scanService.findAll(tenantId, limit, offset);
  }

  @Get('my-history')
  @Permissions(Permission.SCAN_QR, Permission.VIEW_SCAN_LOGS)
  async findMyScans(@Request() req: RequestWithUser) {
    const { userId, tenantId } = req.user;
    return this.scanService.findMyScans(userId, tenantId);
  }

  @Get('by-qrcode/:qrCodeId')
  @Permissions(Permission.VIEW_SCAN_LOGS)
  async findByQrCode(
    @Param('qrCodeId', ParseUUIDPipe) qrCodeId: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId } = req.user;
    return this.scanService.findByQrCode(qrCodeId, tenantId);
  }
}