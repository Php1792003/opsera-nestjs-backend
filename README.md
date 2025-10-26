# 🚀 OPSERA - Hệ thống Quản lý Tuần tra QR Code

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white" alt="SQL Server" />
</p>

## 📋 Mô tả

**Opsera** là hệ thống quản lý tuần tra quét mã QR đa người thuê (multi-tenant) được xây dựng với **NestJS**, **Prisma ORM** và **SQL Server**. Hệ thống cung cấp giải pháp toàn diện cho việc quản lý dự án, phân công công việc, và theo dõi hoạt động tuần tra thông qua quét mã QR với GPS tracking.

### ✨ Tính năng chính

- 🏢 **Multi-tenant Architecture** - Hỗ trợ nhiều tổ chức độc lập
- 🔐 **Role-based Access Control (RBAC)** - 52 permissions chi tiết
- 📱 **QR Code Management** - Tạo, quản lý và quét mã QR
- 📍 **GPS Tracking** - Yêu cầu di chuyển tối thiểu 50m giữa các lần quét
- ✅ **Task Management** - Phân công và theo dõi công việc
- 📊 **Analytics & Reports** - Thống kê chi tiết và báo cáo
- 📝 **Activity Logging** - Audit trail đầy đủ
- 💳 **Subscription Plans** - 3 gói dịch vụ (STARTER, PRO, ENTERPRISE)

## 💰 Gói dịch vụ

| Gói | Giá/tháng | QR Codes | Users | Projects | Storage |
|-----|-----------|----------|-------|----------|---------|
| **STARTER** | 299,000đ | 100 | 5 | 3 | 1GB |
| **PRO** | 899,000đ | 500 | 20 | 15 | 5GB |
| **ENTERPRISE** | 2,499,000đ | 2000 | Unlimited | Unlimited | 20GB |

## 🛠️ Công nghệ sử dụng

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **ORM**: Prisma 6.18
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer

## 📦 Cài đặt nhanh

```bash
# Clone repository
git clone <repository-url>
cd opsera-nestjs-backend

# Cài đặt dependencies
npm install

# Setup database (xem SETUP_GUIDE.md)
npx prisma generate
npx prisma db push

# Chạy development server
npm run start:dev
```

Server sẽ chạy tại: http://localhost:3000

## 📚 Documentation

- 📖 **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Hướng dẫn cài đặt chi tiết
- 📖 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API documentation đầy đủ

## 🏗️ Cấu trúc Module

```
src/
├── auth/              # Authentication & JWT
├── role/              # Role & Permission System (52 permissions)
├── project/           # Project Management
├── qrcode/            # QR Code CRUD
├── task/              # Task Management (PENDING, IN_PROGRESS, COMPLETED)
├── scan-log/          # QR Scanning với GPS Tracking
├── activity-log/      # Activity Logging & Audit Trail
├── subscription/      # Subscription & Payment Management
└── prisma/            # Database Service
```

## 🔐 Permissions

Hệ thống có **52 permissions** được nhóm theo:
- User Management (5)
- Role Management (5)
- Project Management (5)
- QR Code Management (6)
- Task Management (7)
- Reports & Analytics (6)
- Activity & Scan Logs (6)
- Tenant Settings (2)

## 🚀 Scripts

```bash
# Development
npm run start:dev       # Chạy với hot reload

# Production
npm run build          # Build project
npm run start:prod     # Chạy production

# Database
npx prisma generate    # Generate Prisma Client
npx prisma db push     # Push schema to database
npx prisma studio      # Mở Prisma Studio GUI

# Testing
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage
```

## 🎯 Roadmap

### ✅ Completed (Phase 1 - Backend)
- [x] Multi-tenant authentication system
- [x] Role & Permission management (RBAC)
- [x] Project & QR Code CRUD
- [x] Task management system
- [x] QR Scanning with GPS tracking
- [x] Activity logging & Audit trail
- [x] Subscription & Payment management
- [x] API documentation

### 🔲 In Progress (Phase 2)
- [ ] Super Admin dashboard
- [ ] Tenant management API
- [ ] User management within tenant
- [ ] Payment gateway integration (MoMo, Visa)

### 🔲 Planned (Phase 3 - Frontend)
- [ ] Next.js setup với Glassmorphism UI
- [ ] Authentication pages
- [ ] Dashboard with analytics
- [ ] QR Scanner interface
- [ ] Task board (Kanban view)
- [ ] Reports & Export

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

- **Email**: support@opsera.vn
- **Documentation**: Xem `API_DOCUMENTATION.md`
- **Setup Guide**: Xem `SETUP_GUIDE.md`

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025  
**Built with** ❤️ **by Opsera Development Team**
