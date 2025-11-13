import { Module } from '@nestjs/common';
import { MasterAdminService } from './master-admin.service';
import { MasterAdminController } from './master-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MasterAdminController],
  providers: [MasterAdminService],
})
export class MasterAdminModule {}
