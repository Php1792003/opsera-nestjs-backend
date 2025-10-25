import { Module } from '@nestjs/common';
import { QrcodeController } from './qrcode.controller';
import { QrCodeService } from './qrcode.service';

@Module({
  controllers: [QrcodeController],
  providers: [QrCodeService],
})
export class QrcodeModule {}
