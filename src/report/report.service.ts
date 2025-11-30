import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { AiAnalysisService } from './ai-analysis.service';
import { startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class ReportService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiAnalysisService
    ) { }

    async getDashboardStats(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        if (!projectId) {
            throw new BadRequestException('Project ID is required');
        }

        // 1. Xử lý Filter Date Range
        const dateRange: any = {};
        if (startDate && endDate) {
            dateRange.gte = startOfDay(new Date(startDate));
            dateRange.lte = endOfDay(new Date(endDate));
        }

        // FIX: Incident dùng 'reportedAt', Task dùng 'createdAt'
        // Bạn cần kiểm tra lại schema.prisma để chắc chắn tên trường.
        // Giả sử Incident dùng 'reportedAt' và Task dùng 'createdAt'.

        const incidentFilter: any = { projectId, tenantId };
        if (startDate && endDate) incidentFilter.reportedAt = dateRange; // <--- SỬA TỪ createdAt THÀNH reportedAt

        const taskFilter: any = { projectId, tenantId };
        if (startDate && endDate) taskFilter.createdAt = dateRange;

        // 2. KPI TỔNG QUAN
        const totalIncidents = await this.prisma.incident.count({ where: incidentFilter });
        const totalTasks = await this.prisma.task.count({ where: taskFilter });
        const completedTasks = await this.prisma.task.count({ where: { ...taskFilter, status: 'COMPLETED' } });
        const taskCompletionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        const activeStaff = await this.prisma.projectMember.count({ where: { projectId } });

        // 3. BIỂU ĐỒ 1: TỔNG SỐ LẦN SỰ CỐ
        const incidents = await this.prisma.incident.findMany({
            where: incidentFilter,
            select: { reportedAt: true }, // <--- SỬA TỪ createdAt THÀNH reportedAt
            orderBy: { reportedAt: 'asc' }
        });

        const incidentMap = new Map<string, number>();
        incidents.forEach(inc => {
            // FIX: Check null trước khi format
            if (inc.reportedAt) {
                const dateStr = format(inc.reportedAt, 'yyyy-MM-dd');
                incidentMap.set(dateStr, (incidentMap.get(dateStr) || 0) + 1);
            }
        });

        const incidentChartData: { labels: string[], actual: number[], plan: number[] } = { labels: [], actual: [], plan: [] };

        if (incidentMap.size > 0) {
            for (const [date, count] of incidentMap.entries()) {
                incidentChartData.labels.push(date);
                incidentChartData.actual.push(count);
                incidentChartData.plan.push(5);
            }
        } else {
            incidentChartData.labels.push(format(new Date(), 'yyyy-MM-dd'));
            incidentChartData.actual.push(0);
            incidentChartData.plan.push(5);
        }


        // 4. BIỂU ĐỒ 2: PHÂN LOẠI SỰ CỐ THEO ROLE (%)
        const incidentsForRole = await this.prisma.incident.findMany({
            where: incidentFilter,
            select: { department: true }
        });

        const roleCountMap = new Map<string, number>();
        incidentsForRole.forEach(inc => {
            const roleName = inc.department || 'Chưa phân công';
            roleCountMap.set(roleName, (roleCountMap.get(roleName) || 0) + 1);
        });

        const incidentByRoleData: { labels: string[], data: number[] } = { labels: [], data: [] };
        roleCountMap.forEach((count, roleName) => {
            incidentByRoleData.labels.push(roleName);
            incidentByRoleData.data.push(count);
        });


        // 5. BẢNG ĐÁNH GIÁ THÀNH VIÊN
        const completedTasksList = await this.prisma.task.findMany({
            where: {
                projectId: projectId,
                tenantId: tenantId,
                status: 'COMPLETED',
                ...taskFilter, // Dùng taskFilter (có createdAt)
                assigneeId: { not: null }
            },
            include: {
                assignee: { select: { id: true, fullName: true } }
            }
        });

        const userStats = new Map<string, { name: string, count: number }>();

        completedTasksList.forEach(task => {
            const uid = task.assigneeId;
            if (!uid) return;

            const uname = task.assignee?.fullName || 'Unknown';
            if (!userStats.has(uid)) {
                userStats.set(uid, { name: uname, count: 0 });
            }

            const stat = userStats.get(uid);
            if (stat) stat.count += 1;
        });

        const topStaff = Array.from(userStats.values()).map(u => ({
            name: u.name,
            scans: u.count,
            score: u.count * 5
        })).sort((a, b) => b.score - a.score);

        return {
            stats: {
                totalPatrols: 0,
                patrolGrowth: 0,
                totalIncidents,
                taskCompletionRate,
                activeStaff
            },
            charts: {
                patrol: incidentChartData,
                incident: incidentByRoleData
            },
            topStaff: topStaff
        };
    }

    async exportExcelReport(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId, startDate, endDate);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        worksheet.addRow(['BÁO CÁO DỰ ÁN', project.name]);
        worksheet.addRow(['Thời gian', `${startDate || 'Toàn bộ'} - ${endDate || 'Toàn bộ'}`]);
        worksheet.addRow([]);

        worksheet.addRow(['THỐNG KÊ CHUNG']);
        worksheet.addRow(['Tổng sự cố', statsData.stats.totalIncidents]);
        worksheet.addRow(['Tỷ lệ hoàn thành Task', statsData.stats.taskCompletionRate + '%']);
        worksheet.addRow(['Nhân sự hoạt động', statsData.stats.activeStaff]);
        worksheet.addRow([]);

        worksheet.addRow(['BẢNG ĐÁNH GIÁ NHÂN VIÊN']);
        worksheet.addRow(['Họ tên', 'Task Hoàn thành', 'Điểm số']);
        statsData.topStaff.forEach(staff => {
            worksheet.addRow([staff.name, staff.scans, staff.score]);
        });

        return workbook;
    }

    async getAiAnalysis(projectId: string, tenantId: string, startDate?: string, endDate?: string) {
        const statsData = await this.getDashboardStats(projectId, tenantId, startDate, endDate);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');
        return this.aiService.analyzeProjectPerformance({ ...statsData, projectName: project.name });
    }
}