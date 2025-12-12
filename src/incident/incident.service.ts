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
                const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    if (buffer.length > 20971520) continue;

                    const fileName = `inc_${Date.now()}_${i}.jpg`;
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, buffer);
                    savedImageUrls.push(`/uploads/${fileName}`);
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
            orderBy: { reportedAt: 'desc' },
        });

        return incidents.map(inc => {
            const qrName = inc.qrCode ? inc.qrCode.name : 'Điểm chưa định danh';

            const imageUrls = inc.images.map(img => img.url);

            return {
                id: inc.id,
                description: inc.description,
                status: inc.status,

                qrCode: qrName,
                location: inc.qrCode ? inc.qrCode.location : 'Chưa cập nhật vị trí',

                reporter: inc.reporter ? inc.reporter.fullName : 'Ẩn danh',
                images: imageUrls,
                image: imageUrls.length > 0 ? imageUrls[0] : null,
                department: inc.department || 'Unassigned',
                hasTask: !!inc.taskId
            };
        });
    }


    // 3. ADMIN/QUẢN LÝ NHẤN NÚT "PHÂN CÔNG"
    // Logic: 1 Incident = 1 Task. Nếu có rồi -> Lỗi. Nếu chưa -> Tạo Task -> Gán Role.
    async assignIncident(
        incidentId: string,
        roleName: string, // Role được chọn từ Dropdown
        tenantId: string,
        userId: string,
    ) {
        // 3.1 Lấy thông tin Incident
        const incident = await this.prisma.incident.findFirst({
            where: { id: incidentId, tenantId },
            include: { images: true, qrCode: true }
        });

        if (!incident) throw new NotFoundException('Không tìm thấy sự cố.');

        // 3.2 Kiểm tra quy tắc 1 Incident = 1 Task
        if (incident.taskId) {
            throw new ConflictException('Sự cố này đã được tạo Task xử lý.');
        }

        // 3.3 Kiểm tra Role có tồn tại trong Project hiện tại không
        const role = await this.roleService.findByNameAndProject(roleName, incident.projectId, tenantId);
        if (!role) {
            throw new BadRequestException(`Bộ phận '${roleName}' không tồn tại trong dự án này.`);
        }

        // 3.4 Tạo Task mới
        const locationName = incident.qrCode ? incident.qrCode.name : 'QR Code';
        const task = await this.prisma.task.create({
            data: {
                title: `Sự cố tại: ${locationName}`,
                description: incident.description,
                priority: 'HIGH',
                status: 'PENDING', // Task mới tạo trạng thái Pending
                projectId: incident.projectId,
                tenantId: tenantId,
                creatorId: userId,
                // Gắn thẻ Role để User thuộc Role đó nhận diện được quyền tiếp nhận
                tags: JSON.stringify(['Incident', `Role:${role.name}`]),
            }
        });

        // 3.5 Copy ảnh từ Incident sang Task Attachment (để nhân viên xử lý xem)
        if (incident.images.length > 0) {
            for (const img of incident.images) {
                await this.prisma.taskAttachment.create({
                    data: {
                        taskId: task.id,
                        fileName: path.basename(img.url),
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

        // 3.6 Cập nhật ngược lại Incident: Link Task ID và đổi Status
        await this.prisma.incident.update({
            where: { id: incidentId },
            data: {
                status: 'ASSIGNED',
                department: role.name, // Lưu tên role hiển thị UI
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