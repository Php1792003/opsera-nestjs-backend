import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QrCodeService } from './qrcode.service';
import { CreateQrCodeDto } from '../auth/dto/create-qrcode.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('qrcodes')
@UseGuards(JwtAuthGuard)
export class QrcodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post()
  async create(
    @Body() createQrCodeDto: CreateQrCodeDto,
    @Request() req: RequestWithUser,
  ) {
    const tenantId = req.user.tenantId;
    return this.qrCodeService.create(createQrCodeDto, tenantId);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    return this.qrCodeService.findAll(tenantId);
  }
}
