import { Module } from '@nestjs/common';
import { ScanLogController } from './scan-log.controller';
import { ScanLogService } from './scan-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [ScanLogController],
  providers: [ScanLogService],
  exports: [ScanLogService],
})
export class ScanLogModule {}
