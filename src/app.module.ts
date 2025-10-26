import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { QrcodeModule } from './qrcode/qrcode.module';
import { ProjectModule } from './project/project.module';
import { RoleModule } from './role/role.module';
import { TaskModule } from './task/task.module';
import { ScanLogModule } from './scan-log/scan-log.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ActivityLogModule, // Load this early as it's global
    SubscriptionModule,
    QrcodeModule,
    ProjectModule,
    RoleModule,
    TaskModule,
    ScanLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
