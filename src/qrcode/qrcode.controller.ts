import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QrCodeService } from './qrcode.service';
import { CreateQrCodeDto } from './dto/create-qrcode.dto';
import { UpdateQrCodeDto } from './dto/update-qrcode.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('qrcodes')
@UseGuards(JwtAuthGuard)
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) { }

  @Post()
  async create(
    @Body() createQrCodeDto: CreateQrCodeDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.qrCodeService.create(createQrCodeDto, tenantId, userId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    const { tenantId } = req.user;
    return this.qrCodeService.findAll(tenantId);
  }

  // MỚI: API lấy nhật ký quét
  @Get('logs')
  async getLogs(@Request() req: RequestWithUser) {
    const { tenantId } = req.user;
    return this.qrCodeService.getRecentScanLogs(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const { tenantId } = req.user;
    return this.qrCodeService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQrCodeDto: UpdateQrCodeDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.qrCodeService.update(id, updateQrCodeDto, tenantId, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const { tenantId, userId } = req.user;
    return this.qrCodeService.delete(id, tenantId, userId);
  }
}