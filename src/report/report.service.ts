import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { AiAnalysisService } from './ai-analysis.service';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class ReportService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiAnalysisService
    ) { }

    async getDashboardStats(projectId: string, tenantId: string) {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // Filter common
        const whereProjectFilter = {
            qrCode: { projectId: projectId },
            tenantId: tenantId
        };

        // 1. KPI
        const currentPatrols = await this.prisma.scanLog.count({
            where: { ...whereProjectFilter, scannedAt: { gte: currentMonthStart } }
        });
        const lastMonthPatrols = await this.prisma.scanLog.count({
            where: { ...whereProjectFilter, scannedAt: { gte: lastMonthStart, lte: lastMonthEnd } }
        });
        const patrolGrowth = lastMonthPatrols === 0 ? 100 : Math.round(((currentPatrols - lastMonthPatrols) / lastMonthPatrols) * 100);

        const totalIncidents = await this.prisma.scanLog.count({
            where: { ...whereProjectFilter, status: 'ISSUE' }
        });

        const totalTasks = await this.prisma.task.count({ where: { projectId, tenantId } });
        const completedTasks = await this.prisma.task.count({ where: { projectId, tenantId, status: 'COMPLETED' } });
        const taskCompletionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        // Đếm nhân sự (thông qua bảng user) - logic đơn giản là đếm user trong tenant
        // (Hoặc lọc kỹ hơn nếu có bảng ProjectMember)
        const activeStaff = await this.prisma.user.count({
            where: { tenantId, status: 'active' }
        });

        // 2. Charts Data
        const patrolChartData: { labels: string[]; actual: number[]; plan: number[] } = { labels: [], actual: [], plan: [] };

        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const count = await this.prisma.scanLog.count({
                where: { ...whereProjectFilter, scannedAt: { gte: startOfDay(date), lte: endOfDay(date) } }
            });
            patrolChartData.labels.push(date.toISOString().split('T')[0]);
            patrolChartData.actual.push(count);
            patrolChartData.plan.push(50);
        }

        // Incident by Role
        const incidentsByRoleRaw = await this.prisma.scanLog.findMany({
            where: { ...whereProjectFilter, status: 'ISSUE' },
            include: { user: { include: { role: true } } }
        });
        const incidentsByRoleMap = new Map<string, number>();
        incidentsByRoleRaw.forEach(log => {
            const roleName = log.user?.role?.name || 'Unknown';
            incidentsByRoleMap.set(roleName, (incidentsByRoleMap.get(roleName) || 0) + 1);
        });

        // 3. Top Staff
        const topScanners = await this.prisma.scanLog.groupBy({
            by: ['userId'],
            where: { ...whereProjectFilter },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        const topStaff = await Promise.all(topScanners.map(async (item) => {
            if (!item.userId) return null;
            const user = await this.prisma.user.findUnique({ where: { id: item.userId } });
            return {
                id: user?.id,
                name: user?.fullName || 'Unknown',
                scans: item._count.id,
                score: Math.min(item._count.id * 10, 100)
            };
        }));

        return {
            stats: { totalPatrols: currentPatrols, patrolGrowth, totalIncidents, taskCompletionRate, activeStaff },
            charts: {
                patrol: patrolChartData,
                incident: {
                    labels: Array.from(incidentsByRoleMap.keys()),
                    data: Array.from(incidentsByRoleMap.values())
                }
            },
            topStaff: topStaff.filter(s => s !== null)
        };
    }

    async exportExcelReport(projectId: string, tenantId: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        const aiReview = await this.aiService.analyzeProjectPerformance({ ...statsData, projectName: project.name });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        worksheet.addRow(['BÁO CÁO DỰ ÁN', project.name]);
        worksheet.addRow(['Tổng tuần tra', statsData.stats.totalPatrols]);
        worksheet.addRow(['Sự cố', statsData.stats.totalIncidents]);
        worksheet.addRow(['AI Đánh giá:', aiReview.replace(/<[^>]*>/g, '')]);

        return workbook;
    }

    async getAiAnalysis(projectId: string, tenantId: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');
        return this.aiService.analyzeProjectPerformance({ ...statsData, projectName: project.name });
    }
}