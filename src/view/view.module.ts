import { Module } from '@nestjs/common';
import { ViewController } from './view.controller';
import { MasterAdminModule } from '../master-admin/master-admin.module';

@Module({
  imports: [MasterAdminModule, ViewModule],
  controllers: [ViewController],
})
export class ViewModule {}
