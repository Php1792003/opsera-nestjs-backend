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

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (val: number) => (val * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async create(dto: CreateScanDto, userId: string, tenantId: string) {
    // 1. Validate Images (Giữ nguyên)
    if (dto.images && dto.images.length > 0) {
      if (dto.images.length > 5) throw new BadRequestException('Tối đa 5 ảnh.');
      const maxSize = 20 * 1024 * 1024;
      for (const img of dto.images) {
        if ((img.length * 3) / 4 > maxSize) throw new BadRequestException('Ảnh > 20MB.');
      }
    }

    // 2. Validate QR Code (Giữ nguyên)
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { data: dto.qrCodeData },
      include: { project: true },
    });
    if (!qrCode || qrCode.tenantId !== tenantId) throw new ForbiddenException('Lỗi quyền truy cập.');

    // 3. LẤY LỊCH SỬ QUÉT GẦN NHẤT
    const lastScan = await this.prisma.scanLog.findFirst({
      where: {
        userId, tenantId, status: 'VALID',
        latitude: { not: null }, longitude: { not: null },
      },
      orderBy: { scannedAt: 'desc' },
      select: { scannedAt: true, latitude: true, longitude: true, accuracy: true },
    });

    // 4. KIỂM TRA GIAN LẬN (LOGIC MỚI: 15 PHÚT)
    if (dto.status === 'VALID' || !dto.status) {
      if (lastScan) {
        const timeDiff = (new Date().getTime() - new Date(lastScan.scannedAt).getTime()) / 1000; // Giây

        // A. Chặn Spam (30 giây) - Bắt buộc
        if (timeDiff < 30) {
          throw new BadRequestException(`Thao tác quá nhanh! Đợi ${Math.ceil(30 - timeDiff)}s.`);
        }

        // B. KIỂM TRA KHOẢNG CÁCH (CHỈ CHECK NẾU CHƯA ĐỦ 15 PHÚT)
        // 900 giây = 15 phút
        if (timeDiff < 900) {
          if (dto.latitude && dto.longitude && lastScan.latitude && lastScan.longitude) {
            const distance = this.calculateDistance(lastScan.latitude, lastScan.longitude, dto.latitude, dto.longitude);

            // Nếu chưa đủ 15 phút MÀ khoàng cách lại gần (< 30m) => Chặn
            if (distance < 30) {
              const minutesLeft = Math.ceil((900 - timeDiff) / 60);
              throw new BadRequestException(
                `Vui lòng di chuyển đến vị trí tiếp theo.`
              );
            }
          }
        }
        // Nếu timeDiff >= 900 (đã qua 15p), hệ thống sẽ bỏ qua check distance -> Cho phép quét lại.
      }
    }

    // 5. LƯU VÀO DB (Giữ nguyên)
    return this.prisma.$transaction(async (tx) => {
      const scanLog = await tx.scanLog.create({
        data: {
          qrCodeId: qrCode.id, userId, tenantId,
          location: dto.location, latitude: dto.latitude, longitude: dto.longitude,
          accuracy: dto.accuracy, status: dto.status || 'VALID', notes: dto.notes,
        },
        include: { qrCode: { select: { name: true, location: true } }, user: { select: { fullName: true } } },
      });

      if (dto.status === 'ISSUE') {
        const incident = await tx.incident.create({
          data: {
            description: dto.issueDescription || dto.notes || 'Reported via Scan',
            status: 'OPEN', tenantId, projectId: qrCode.projectId,
            qrCodeId: qrCode.id, scanLogId: scanLog.id, reporterId: userId,
          },
        });
        if (dto.images?.length) {
          await tx.incidentImage.createMany({
            data: dto.images.map((img) => ({ incidentId: incident.id, url: img })),
          });
        }
      }
      return scanLog;
    });
  }

  // --- Các hàm findAll, findMyScans, findByQrCode giữ nguyên ---
  async findAll(tenantId: string, limit: number = 50, offset: number = 0) {
    const logs = await this.prisma.scanLog.findMany({
      where: { tenantId: tenantId },
      include: {
        qrCode: { select: { id: true, name: true, location: true, projectId: true } },
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { scannedAt: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await this.prisma.scanLog.count({ where: { tenantId: tenantId } });
    return { logs, total };
  }

  async findByQrCode(qrCodeId: string, tenantId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id: qrCodeId, tenantId: tenantId },
    });
    if (!qrCode) throw new NotFoundException('QR code not found or access denied.');

    return this.prisma.scanLog.findMany({
      where: { qrCodeId: qrCodeId, tenantId: tenantId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { scannedAt: 'desc' },
      take: 100,
    });
  }

  async findMyScans(userId: string, tenantId: string) {
    return this.prisma.scanLog.findMany({
      where: { userId: userId, tenantId: tenantId },
      include: { qrCode: { select: { id: true, name: true, location: true } } },
      orderBy: { scannedAt: 'desc' },
      take: 50,
    });
  }
}