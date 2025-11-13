import { Module } from '@nestjs/common';
import { QrCodeController } from './qrcode.controller';
import { QrCodeService } from './qrcode.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [QrCodeController],
  providers: [QrCodeService],
})
export class QrcodeModule {}
