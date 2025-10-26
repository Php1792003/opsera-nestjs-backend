import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { QrcodeModule } from './qrcode/qrcode.module';
import { ProjectModule } from './project/project.module';
import { RoleModule } from './role/role.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { MasterAdminModule } from './master-admin/master-admin.module';
import { AuditModule } from './audit/audit.module';
import { TaskModule } from './task/task.module';
import { ScanLogModule } from './scan-log/scan-log.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    QrcodeModule,
    ProjectModule,
    RoleModule,
    SubscriptionModule,
    MasterAdminModule,
    AuditModule,
    TaskModule,
    ScanLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
