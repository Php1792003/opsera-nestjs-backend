import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';

// Core Modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

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
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'paul.krajcik15@ethereal.email',
            pass: 'EyjczQTbxy3qkBmD5F',
          },
        },
        defaults: {
          from: '"Opsera Notifier" <no-reply@opsera.com>',
        },
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
