import { Module, Global } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RoleModule } from '../role/role.module';

@Global() // Make this module global so it can be used everywhere
@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService], // Export so other modules can log activities
})
export class ActivityLogModule {}
