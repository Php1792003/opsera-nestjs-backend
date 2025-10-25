import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QrCodeService } from './qrcode.service';
import { CreateQrCodeDto } from '../auth/dto/create-qrcode.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('qrcodes')
export class QrcodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createQrCodeDto: CreateQrCodeDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    return this.qrCodeService.create(createQrCodeDto, tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.qrCodeService.findAll(tenantId);
  }

  @Get('test/:tenantId')
  async findAllTest(@Param('tenantId') tenantId: string) {
    return this.qrCodeService.findAll(tenantId);
  }
}
