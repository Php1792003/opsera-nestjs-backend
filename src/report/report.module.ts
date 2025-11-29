import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { AiAnalysisService } from './ai-analysis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ReportController],
    providers: [ReportService, AiAnalysisService],
})
export class ReportModule { }