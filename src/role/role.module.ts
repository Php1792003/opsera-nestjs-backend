import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // RoleService có thể cần PrismaModule
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService], // <-- DÒNG NÀY RẤT QUAN TRỌNG
})
export class RoleModule {}
