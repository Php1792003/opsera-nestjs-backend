# 🚀 OPSERA - HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY

## 📋 YÊU CẦU HỆ THỐNG

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **SQL Server**: 2019 hoặc mới hơn
- **Git**: Để clone repository

---

## 🔧 BƯỚC 1: CÀI ĐẶT DEPENDENCIES

```bash
# Clone repository (nếu chưa có)
git clone <repository-url>
cd opsera-nestjs-backend

# Cài đặt packages
npm install
```

---

## 💾 BƯỚC 2: CẤU HÌNH DATABASE

### A. Cài đặt SQL Server

#### **Windows:**
1. Download SQL Server 2019/2022 Express từ Microsoft
2. Cài đặt với SQL Server Authentication
3. Nhớ password cho user `sa`

#### **macOS/Linux (sử dụng Docker):**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123" \
   -p 1433:1433 --name sqlserver \
   -d mcr.microsoft.com/mssql/server:2019-latest
```

### B. Tạo Database

Kết nối vào SQL Server và chạy:

```sql
CREATE DATABASE opsera_db;
GO
```

Hoặc sử dụng SQL Server Management Studio (SSMS)

---

## ⚙️ BƯỚC 3: CẤU HÌNH ENVIRONMENT

File `.env` đã được tạo tự động. Chỉnh sửa theo database của bạn:

```env
# Database Connection
DATABASE_URL="sqlserver://localhost:1433;database=opsera_db;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"

# JWT Secret Key (đổi trong production!)
JWT_SECRET="opsera-super-secret-jwt-key-2025"

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development
```

### 📝 Lưu ý về DATABASE_URL:
- **localhost**: Thay bằng IP server nếu remote
- **database**: Tên database (mặc định: opsera_db)
- **user**: Username SQL Server (mặc định: sa)
- **password**: Password của user
- **encrypt=true**: Bật mã hóa
- **trustServerCertificate=true**: Tin tưởng certificate (dev only)

---

## 🗄️ BƯỚC 4: CHẠY MIGRATION

```bash
# Generate Prisma Client
npx prisma generate

# Tạo migration từ schema
npx prisma migrate dev --name init

# Hoặc push schema trực tiếp (không tạo migration file)
npx prisma db push
```

### Kiểm tra Database:
```bash
# Mở Prisma Studio để xem database
npx prisma studio
```
Truy cập: http://localhost:5555

---

## 🏃 BƯỚC 5: CHẠY SERVER

### Development Mode (với hot reload):
```bash
npm run start:dev
```

### Production Mode:
```bash
# Build
npm run build

# Run production
npm run start:prod
```

### Debug Mode:
```bash
npm run start:debug
```

Server sẽ chạy tại: **http://localhost:3000**

---

## 🧪 BƯỚC 6: TEST API

### Option 1: Sử dụng Postman/Thunder Client

1. Import file `API_DOCUMENTATION.md`
2. Tạo Environment:
```json
{
  "baseUrl": "http://localhost:3000",
  "token": ""
}
```

### Option 2: Sử dụng cURL

**1. Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Admin123456",
    "fullName": "Admin User",
    "tenantName": "My Company"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Admin123456"
  }'
```

Copy `access_token` từ response.

**3. Test Protected Route:**
```bash
curl -X GET http://localhost:3000/roles/my-permissions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔍 TROUBLESHOOTING

### Lỗi: "Cannot connect to SQL Server"
```bash
# Kiểm tra SQL Server đang chạy
# Windows:
services.msc → tìm "SQL Server"

# Docker:
docker ps | grep sqlserver

# Test connection
sqlcmd -S localhost -U sa -P YourPassword123
```

### Lỗi: "Prisma Client not generated"
```bash
# Generate lại Prisma Client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Lỗi: "Port 3000 already in use"
```bash
# Windows: Tìm process đang dùng port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Hoặc đổi PORT trong .env
PORT=3001
```

### Lỗi: "Migration failed"
```bash
# Reset database (XÓA TẤT CẢ DATA!)
npx prisma migrate reset

# Hoặc push schema trực tiếp
npx prisma db push --force-reset
```

---

## 📁 CẤU TRÚC PROJECT

```
opsera-nestjs-backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── src/
│   ├── auth/               # Authentication module
│   ├── role/               # Role & Permission
│   ├── project/            # Project management
│   ├── qrcode/             # QR Code CRUD
│   ├── task/               # Task management
│   ├── scan-log/           # QR Scanning với GPS
│   ├── activity-log/       # Activity logging
│   ├── subscription/       # Subscription plans
│   ├── prisma/             # Prisma service
│   ├── main.ts             # Entry point
│   └── app.module.ts       # Root module
├── .env                    # Environment variables (GIT IGNORE!)
├── .env.example            # Environment template
├── API_DOCUMENTATION.md    # API docs
└── package.json            # Dependencies
```

---

## 🔐 BẢO MẬT

### ⚠️ QUAN TRỌNG - PRODUCTION:

1. **Đổi JWT_SECRET:**
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Đổi Database Password:** Không dùng password mặc định

3. **Enable HTTPS:** Bật SSL certificate cho database

4. **Environment Variables:** Không commit `.env` vào Git

5. **CORS:** Cấu hình CORS trong `main.ts` cho production

---

## 📦 SEED DATA (Optional)

Tạo file `prisma/seed.ts` để seed data mẫu:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin
  const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@opsera.vn',
      password: hashedPassword,
      fullName: 'Super Admin',
      isSuperAdmin: true,
      isTenantAdmin: false,
      tenant: {
        create: {
          name: 'Opsera System',
          subscriptionPlan: 'ENTERPRISE',
        },
      },
    },
  });

  console.log('Super Admin created:', superAdmin.email);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

Chạy seed:
```bash
npx prisma db seed
```

---

## 📞 HỖ TRỢ

- **Documentation**: `API_DOCUMENTATION.md`
- **Issues**: Tạo issue trên GitHub
- **Email**: support@opsera.vn

---

## 🎯 NEXT STEPS

1. ✅ Setup database và chạy migration
2. ✅ Test tất cả API endpoints
3. ✅ Tạo roles và permissions
4. ✅ Test QR scanning với GPS
5. 🔲 Develop Frontend (Next.js)
6. 🔲 Deploy lên production
7. 🔲 Setup CI/CD pipeline

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025  
**Author**: Opsera Development Team
