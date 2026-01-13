import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException, // Thêm cái này nếu chưa có
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult } from '../types/prisma.types';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private mailerService: MailerService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResult> {
    // 1. Kiểm tra Email trùng
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 2. Dùng Transaction để đảm bảo toàn vẹn dữ liệu
    // Nếu tạo User lỗi, Tenant sẽ tự động bị xóa
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // A. Tạo Tenant
        const newTenant = await tx.tenant.create({
          data: {
            name: dto.companyName,
            subscriptionPlan: 'STARTER'
          },
        });

        // B. Tạo Role Admin cho Tenant
        const adminRole = await tx.role.create({
          data: {
            name: 'Tenant Admin',
            permissions: '["ALL"]',
            tenantId: newTenant.id,
          },
        });

        // C. Tạo User
        const newUser = await tx.user.create({
          data: {
            email: dto.email,
            fullName: dto.fullName,
            password: hashedPassword,
            tenantId: newTenant.id,
            roleId: adminRole.id,
            isTenantAdmin: true,
            status: 'active',
          },
        });

        return { user: newUser, tenant: newTenant, role: adminRole };
      });
    } catch (error) {
      console.error("Lỗi Transaction Database:", error);
      throw new InternalServerErrorException('Lỗi khi tạo dữ liệu. Vui lòng thử lại.');
    }

    // 3. Gửi Email (Bọc trong Try-Catch riêng để không ảnh hưởng luồng chính)
    try {
      await this.mailerService.sendRegistrationConfirmation(
        result.user.email,
        result.user.fullName
      );
      console.log(`✅ Email đã gửi tới ${result.user.email}`);
    } catch (emailError) {
      console.error("⚠️ Lỗi gửi email (User vẫn được tạo):", emailError.message);
      // Không throw error ở đây để Frontend vẫn nhận được kết quả thành công
    }

    // 4. Log Activity
    try {
      await this.auditService.logActivity(
        result.user.id,
        result.tenant.id,
        'USER_REGISTER',
        { email: result.user.email, tenantName: result.tenant.name },
        'USER',
        result.user.id,
      );
    } catch (e) { console.log('Audit log error ignored'); }

    // 5. Trả về kết quả đăng nhập luôn
    return this.signToken(
      result.user.id,
      result.tenant.id,
      result.user.isTenantAdmin,
      result.user.isSuperAdmin,
      result.user.email,
      result.user.fullName,
      result.role,
    );
  }

  // ... (Giữ nguyên các hàm login và signToken cũ của bạn) ...
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password.trim()))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ... audit log ...
    return this.signToken(user.id, user.tenantId, user.isTenantAdmin, user.isSuperAdmin, user.email, user.fullName, user.role);
  }

  public async signToken(userId: string, tenantId: string, isTenantAdmin: boolean, isSuperAdmin: boolean, email?: string, fullName?: string, role?: any): Promise<{ accessToken: string; user?: any }> {
    const payload = { sub: userId, tenantId, isSuperAdmin, roleId: role?.id };
    const accessToken = await this.jwtService.signAsync(payload);

    // Lấy lại info tenant để trả về frontend
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { subscriptionPlan: true, name: true } });

    return {
      accessToken,
      user: {
        id: userId, email, fullName, tenantId, isTenantAdmin, isSuperAdmin, tenant,
        role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
      },
    };
  }
}