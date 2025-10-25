import { Module } from '@nestjs/common';
import { QrcodeController } from './qrcode.controller';
import { QrCodeService } from './qrcode.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QrcodeController],
  providers: [QrCodeService],
})
export class QrcodeModule {}
