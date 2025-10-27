import { Module } from '@nestjs/common';
import { QrcodeController } from './qrcode.controller';
import { QrCodeService } from './qrcode.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [QrcodeController],
  providers: [QrCodeService],
})
export class QrcodeModule {}
