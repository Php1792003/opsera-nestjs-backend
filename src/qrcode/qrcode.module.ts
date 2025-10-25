import { Module } from '@nestjs/common';
import { QrcodeController } from './qrcode.controller';
import { QrCodeService } from './qrcode.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [QrcodeController],
  providers: [QrCodeService],
})
export class QrcodeModule {}
