import { Controller, Get, Query, Res, UseGuards, Request, InternalServerErrorException } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('dashboard')
    async getDashboard(
        @Request() req,
        @Query('projectId') projectId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportService.getDashboardStats(projectId, req.user.tenantId, startDate, endDate);
    }

    @Get('export')
    async exportExcel(
        @Res() res: Response,
        @Request() req,
        @Query('projectId') projectId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<void> {
        try {
            const workbook = await this.reportService.exportExcelReport(projectId, req.user.tenantId, startDate, endDate);

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + 'Project_Report.xlsx',
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Export Error:", error);
            res.status(500).json({ message: 'Failed to export report' });
        }
    }

    @Get('ai-analyze')
    async aiAnalyze(
        @Request() req,
        @Query('projectId') projectId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        try {
            const analysis = await this.reportService.getAiAnalysis(projectId, req.user.tenantId, startDate, endDate);
            return { analysis };
        } catch (error) {
            console.error("AI Analyze Error:", error);
            throw new InternalServerErrorException("AI Service failed: " + error.message);
        }
    }
}