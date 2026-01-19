import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core Modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppMailerModule } from './mailer/mailer.module'; // Dùng module này, xóa cấu hình inline

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { RoleModule } from './role/role.module';
import { MemberModule } from './member/member.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { TaskModule } from './task/task.module';
import { ScanModule } from './scan/scan.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { MasterAdminModule } from './master-admin/master-admin.module';
import { ViewModule } from './view/view.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { IncidentModule } from './incident/incident.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
      }
    ),

    AppMailerModule,

    AuthModule,
    ProjectModule,
    RoleModule,
    MemberModule,
    QrcodeModule,
    TaskModule,
    ScanModule,
    AuditModule,
    NotificationModule,
    MasterAdminModule,
    ViewModule,
    DashboardModule,
    ReportModule,
    IncidentModule,
    ChatModule,
    UsersModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }