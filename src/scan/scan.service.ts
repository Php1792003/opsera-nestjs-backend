import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateScanDto, userId: string, tenantId: string) {
    // 1. Validate Images (Nếu có)
    if (dto.images && dto.images.length > 0) {
      if (dto.images.length > 5) {
        throw new BadRequestException('Chỉ được phép tải lên tối đa 5 ảnh.');
      }
      // Check size từng ảnh (Base64 length approximation: size in bytes = (length * 3) / 4)
      // 20MB = 20 * 1024 * 1024 bytes
      const maxSize = 20 * 1024 * 1024;
      for (const img of dto.images) {
        const sizeInBytes = (img.length * 3) / 4;
        if (sizeInBytes > maxSize) {
          throw new BadRequestException('Một trong các ảnh vượt quá dung lượng cho phép (20MB).');
        }
      }
    }

    const qrCode = await this.prisma.qRCode.findUnique({
      where: { data: dto.qrCodeData },
      include: { project: true },
    });

    if (!qrCode) throw new NotFoundException('QR code not found.');
    if (qrCode.tenantId !== tenantId) throw new ForbiddenException('Access denied.');

    return this.prisma.$transaction(async (tx) => {
      const scanLog = await tx.scanLog.create({
        data: {
          qrCodeId: qrCode.id,
          userId,
          tenantId,
          location: dto.location,
          status: dto.status || 'VALID',
          notes: dto.notes,
        },
        include: {
          qrCode: { select: { name: true, location: true } },
          user: { select: { fullName: true } }
        }
      });

      // NẾU LÀ SỰ CỐ -> TẠO INCIDENT MỚI (Không check trùng nữa)
      if (dto.status === 'ISSUE') {
        const incident = await tx.incident.create({
          data: {
            description: dto.issueDescription || dto.notes || 'Reported via Scan',
            status: 'OPEN',
            tenantId,
            projectId: qrCode.projectId,
            qrCodeId: qrCode.id,
            scanLogId: scanLog.id,
            reporterId: userId,
          },
        });

        // Lưu danh sách ảnh
        if (dto.images && dto.images.length > 0) {
          await tx.incidentImage.createMany({
            data: dto.images.map(img => ({
              incidentId: incident.id,
              url: img // Lưu base64 trực tiếp vào DB (hoặc upload lên S3 rồi lưu URL ở đây nếu muốn tối ưu)
            }))
          });
        }
      }

      return scanLog;
    });
  }

  async findAll(tenantId: string, limit: number = 50, offset: number = 0) {
    const logs = await this.prisma.scanLog.findMany({
      where: { tenantId: tenantId },
      include: {
        qrCode: {
          select: { id: true, name: true, location: true, projectId: true },
        },
        user: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.scanLog.count({
      where: { tenantId: tenantId },
    });

    return { logs, total };
  }

  async findByQrCode(qrCodeId: string, tenantId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id: qrCodeId, tenantId: tenantId },
    });
    if (!qrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    return this.prisma.scanLog.findMany({
      where: {
        qrCodeId: qrCodeId,
        tenantId: tenantId,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
      take: 100,
    });
  }

  async findMyScans(userId: string, tenantId: string) {
    return this.prisma.scanLog.findMany({
      where: {
        userId: userId,
        tenantId: tenantId,
      },
      include: {
        qrCode: {
          select: { id: true, name: true, location: true },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
      take: 50,
    });
  }
}
