import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateScanDto, userId: string, tenantId: string) {
    // 1. Tìm QR Code dựa trên dữ liệu gửi lên (thường là UUID hoặc code)
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { data: dto.qrCodeData }, // Đảm bảo trường 'data' trong DB là unique
      include: { project: true },
    });

    if (!qrCode) {
      throw new NotFoundException('Mã QR không tồn tại trong hệ thống.');
    }

    if (qrCode.tenantId !== tenantId) {
      throw new ForbiddenException('Bạn không có quyền quét mã này.');
    }

    if (!qrCode.isActive) {
      throw new ForbiddenException('Mã QR này đang bị vô hiệu hóa.');
    }

    // 2. Tạo ScanLog
    const newScanLog = await this.prisma.scanLog.create({
      data: {
        notes: dto.notes,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,

        status: dto.status || 'VALID',
        location: dto.location || 'Không xác định',

        qrCodeId: qrCode.id,
        userId: userId,
        tenantId: tenantId,
      },
      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            location: true,
            projectId: true, // Lấy thêm projectId để Frontend lọc
            project: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return newScanLog;
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
