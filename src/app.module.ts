import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { QrcodeModule } from './qrcode/qrcode.module';
import { ProjectModule } from './project/project.module';
import { RoleModule } from './role/role.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    QrcodeModule,
    ProjectModule,
    RoleModule,
    MemberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
