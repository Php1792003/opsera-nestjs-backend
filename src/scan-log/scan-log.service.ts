import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanLogDto } from './dto/create-scan-log.dto';

@Injectable()
export class ScanLogService {
  constructor(private prisma: PrismaService) {}

  // Minimum distance required to scan (in meters)
  private readonly MIN_DISTANCE_TO_SCAN = 50; // 50 meters

  async create(dto: CreateScanLogDto, userId: string, tenantId: string) {
    // Kiểm tra QR code có tồn tại và thuộc tenant không
    const qrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: dto.qrCodeId,
        tenantId: tenantId,
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    // Kiểm tra QR code có active không
    if (!qrCode.isActive) {
      throw new ForbiddenException('This QR code is inactive and cannot be scanned.');
    }

    // Kiểm tra user có quyền quét không (đã được check ở guard)
    
    // Validate GPS - Kiểm tra user có di chuyển không
    const isValidLocation = await this.validateUserMovement(
      userId,
      dto.qrCodeId,
      dto.latitude,
      dto.longitude,
    );

    if (!isValidLocation) {
      throw new BadRequestException(
        `You must move at least ${this.MIN_DISTANCE_TO_SCAN} meters from your last scan location to scan this QR code.`,
      );
    }

    // Convert attachments array to JSON string
    const attachmentsStr = dto.attachments ? JSON.stringify(dto.attachments) : null;

    // Tạo scan log với GPS location
    const scanLog = await this.prisma.scanLog.create({
      data: {
        qrCodeId: dto.qrCodeId,
        userId: userId,
        tenantId: tenantId,
        notes: dto.notes,
        attachments: attachmentsStr,
      },
      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            location: true,
            data: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // Lưu GPS location vào custom field hoặc có thể extend schema
    // Hiện tại return kèm GPS info
    return {
      ...scanLog,
      gpsLocation: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
      },
      attachments: dto.attachments || [],
    };
  }

  async findAll(
    tenantId: string,
    qrCodeId?: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId: tenantId };

    if (qrCodeId) {
      where.qrCodeId = qrCodeId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) {
        where.scannedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.scannedAt.lte = new Date(endDate);
      }
    }

    const scanLogs = await this.prisma.scanLog.findMany({
      where: where,
      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            location: true,
            data: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    return scanLogs.map(log => this.formatScanLogResponse(log));
  }

  async findOne(id: string, tenantId: string) {
    const scanLog = await this.prisma.scanLog.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            location: true,
            data: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!scanLog) {
      throw new NotFoundException('Scan log not found or access denied.');
    }

    return this.formatScanLogResponse(scanLog);
  }

  async getMyScanLogs(userId: string, tenantId: string, startDate?: string, endDate?: string) {
    const where: any = {
      tenantId: tenantId,
      userId: userId,
    };

    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) {
        where.scannedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.scannedAt.lte = new Date(endDate);
      }
    }

    const scanLogs = await this.prisma.scanLog.findMany({
      where: where,
      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            location: true,
            data: true,
          },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    return scanLogs.map(log => this.formatScanLogResponse(log));
  }

  async getQrCodeScanHistory(qrCodeId: string, tenantId: string) {
    // Kiểm tra QR code
    const qrCode = await this.prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        tenantId: tenantId,
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found or access denied.');
    }

    const scanLogs = await this.prisma.scanLog.findMany({
      where: {
        qrCodeId: qrCodeId,
        tenantId: tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    return {
      qrCode: qrCode,
      totalScans: scanLogs.length,
      scanHistory: scanLogs.map(log => this.formatScanLogResponse(log)),
    };
  }

  async getStatistics(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId: tenantId };

    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) {
        where.scannedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.scannedAt.lte = new Date(endDate);
      }
    }

    const [totalScans, uniqueUsers, uniqueQrCodes] = await Promise.all([
      this.prisma.scanLog.count({ where }),
      this.prisma.scanLog.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.scanLog.findMany({
        where,
        select: { qrCodeId: true },
        distinct: ['qrCodeId'],
      }),
    ]);

    // Top scanned QR codes
    const topQrCodes = await this.prisma.scanLog.groupBy({
      by: ['qrCodeId'],
      where: where,
      _count: {
        qrCodeId: true,
      },
      orderBy: {
        _count: {
          qrCodeId: 'desc',
        },
      },
      take: 10,
    });

    // Get QR code details
    const qrCodeIds = topQrCodes.map(item => item.qrCodeId);
    const qrCodes = await this.prisma.qRCode.findMany({
      where: {
        id: { in: qrCodeIds },
      },
      select: {
        id: true,
        name: true,
        location: true,
      },
    });

    const topQrCodesWithDetails = topQrCodes.map(item => {
      const qrCode = qrCodes.find(qr => qr.id === item.qrCodeId);
      return {
        qrCode: qrCode,
        scanCount: item._count.qrCodeId,
      };
    });

    return {
      totalScans: totalScans,
      uniqueUsers: uniqueUsers.length,
      uniqueQrCodes: uniqueQrCodes.length,
      topQrCodes: topQrCodesWithDetails,
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now',
      },
    };
  }

  // Helper: Validate user movement (GPS check)
  private async validateUserMovement(
    userId: string,
    qrCodeId: string,
    currentLat: number,
    currentLng: number,
  ): Promise<boolean> {
    // Lấy scan log gần nhất của user này cho QR code này
    const lastScan = await this.prisma.scanLog.findFirst({
      where: {
        userId: userId,
        qrCodeId: qrCodeId,
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });

    // Nếu chưa có scan trước đó, cho phép quét
    if (!lastScan) {
      return true;
    }

    // TODO: Get GPS from last scan (need to extend schema or store in notes)
    // For now, we'll allow scanning if last scan was more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastScan.scannedAt < fiveMinutesAgo) {
      return true;
    }

    // In production, calculate distance between last scan GPS and current GPS
    // using Haversine formula
    // For now, return true to allow scanning
    return true;
  }

  // Helper: Calculate distance between two GPS coordinates (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Helper: Format response
  private formatScanLogResponse(scanLog: any) {
    return {
      ...scanLog,
      attachments: scanLog.attachments ? JSON.parse(scanLog.attachments) : [],
    };
  }
}
