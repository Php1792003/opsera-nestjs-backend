import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RoleModule } from '../role/role.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
        RoleModule,
        NotificationModule,
    ],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService],
})
export class IncidentModule { }