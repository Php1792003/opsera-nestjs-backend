import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RoleService } from '../role/role.service';
import { NotificationService } from '../notification/notification.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IncidentService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private roleService: RoleService,
        private notificationService: NotificationService,
    ) { }

    async create(
        data: {
            projectId: string;
            qrCode: string;
            description: string;
            images: string[];
        },
        tenantId: string,
        userId: string,
    ) {
        const project = await this.prisma.project.findFirst({
            where: { id: data.projectId, tenantId },
        });
        if (!project) throw new NotFoundException('Project not found or access denied');

        const qrRecord = await this.prisma.qRCode.findFirst({
            where: { data: data.qrCode, tenantId }
        });

        const savedImageUrls: string[] = [];
        if (data.images && data.images.length > 0) {
            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const imagesToProcess = data.images.slice(0, 5);

            for (let i = 0; i < imagesToProcess.length; i++) {
                const base64String = imagesToProcess[i];
                // Check if it's base64
                const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    if (buffer.length > 20971520) continue;

                    const fileName = `inc_${Date.now()}_${i}.jpg`;
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, buffer);
                    savedImageUrls.push(`/uploads/${fileName}`);
                } else {
                    // If it's already a URL or path (unlikely for create but safe to handle)
                    savedImageUrls.push(base64String);
                }
            }
        }

        const incident = await this.prisma.incident.create({
            data: {
                description: data.description,
                status: 'WAITING_ASSIGNMENT',
                projectId: data.projectId,
                tenantId: tenantId,
                reporterId: userId,
                qrCodeId: qrRecord ? qrRecord.id : null,
                // reportedAt is set automatically by @default(now())
                images: {
                    create: savedImageUrls.map(url => ({ url }))
                }
            },
            include: { images: true }
        });

        const reporter = await this.prisma.user.findUnique({ where: { id: userId } });
        const locationName = qrRecord ? qrRecord.name : 'Vị trí chưa định danh';
        const reporterName = reporter ? reporter.fullName : 'Một nhân viên';

        await this.notificationService.notifyUser(
            userId,
            tenantId,
            'Sự cố mới',
            `${reporterName} đã báo cáo sự cố tại ${locationName}.`,
            'INFO'
        );

        return {
            message: "Báo cáo sự cố thành công. Đang chờ phân công.",
            incidentId: incident.id
        };
    }

    async findAll(tenantId: string, projectId: string) {
        const incidents = await this.prisma.incident.findMany({
            where: {
                tenantId: tenantId,
                projectId: projectId || undefined,
            },
            include: {
                reporter: { select: { id: true, fullName: true } },
                images: true,
                qrCode: { select: { name: true, location: true, data: true } },
                task: { select: { id: true, status: true, assigneeId: true } }
            },
            // Ensure we order by creation time (using reportedAt instead of createdAt)
            orderBy: { reportedAt: 'desc' },
        });

        return incidents.map(inc => {
            const qrName = inc.qrCode ? inc.qrCode.name : 'Điểm chưa định danh';
            const imageUrls = inc.images.map(img => img.url);

            return {
                id: inc.id,
                description: inc.description,
                status: inc.status,

                // --- KEY FIXES FOR FRONTEND ---
                // 1. Time: Return reportedAt explicitly so FE doesn't use new Date()
                reportedAt: inc.reportedAt,

                qrCode: qrName,
                location: inc.qrCode ? inc.qrCode.location : 'Chưa cập nhật vị trí',

                reporter: inc.reporter ? inc.reporter.fullName : 'Ẩn danh',

                // 2. Images: Return all images and a primary thumbnail
                images: imageUrls,
                image: imageUrls.length > 0 ? imageUrls[0] : null,

                department: inc.department || 'Unassigned',
                hasTask: !!inc.taskId
            };
        });
    }

    async assignIncident(
        incidentId: string,
        roleName: string,
        tenantId: string,
        userId: string,
    ) {
        const incident = await this.prisma.incident.findFirst({
            where: { id: incidentId, tenantId },
            include: { images: true, qrCode: true }
        });

        if (!incident) throw new NotFoundException('Không tìm thấy sự cố.');

        if (incident.taskId) {
            throw new ConflictException('Sự cố này đã được tạo Task xử lý.');
        }

        const role = await this.roleService.findByNameAndProject(roleName, incident.projectId, tenantId);
        if (!role) {
            throw new BadRequestException(`Bộ phận '${roleName}' không tồn tại trong dự án này.`);
        }

        const locationName = incident.qrCode ? incident.qrCode.name : 'QR Code';
        const task = await this.prisma.task.create({
            data: {
                title: `Sự cố tại: ${locationName}`,
                description: incident.description,
                priority: 'HIGH',
                status: 'PENDING',
                projectId: incident.projectId,
                tenantId: tenantId,
                creatorId: userId,
                tags: JSON.stringify(['Incident', `Role:${role.name}`]),
            }
        });

        if (incident.images.length > 0) {
            for (const img of incident.images) {
                await this.prisma.taskAttachment.create({
                    data: {
                        taskId: task.id,
                        fileName: path.basename(img.url) || 'evidence.jpg',
                        originalName: 'Incident Evidence',
                        mimeType: 'image/jpeg',
                        size: 0,
                        filePath: img.url,
                        userId: userId,
                        tenantId: tenantId
                    }
                });
            }
        }

        await this.prisma.incident.update({
            where: { id: incidentId },
            data: {
                status: 'ASSIGNED',
                department: role.name,
                taskId: task.id
            }
        });

        await this.auditService.logActivity(userId, tenantId, 'ASSIGN_INCIDENT', { incidentId, role: role.name }, 'INCIDENT', incidentId);

        await this.notificationService.notifyRole(
            role.name,
            tenantId,
            'Phân công sự cố',
            `Bộ phận ${role.name} được phân công xử lý sự cố tại ${locationName}.`
        );
        return { message: 'Đã phân công và tạo công việc thành công.' };
    }
}