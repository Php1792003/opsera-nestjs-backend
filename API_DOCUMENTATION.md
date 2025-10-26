# 🚀 OPSERA - API DOCUMENTATION

## 📋 Tổng quan Dự án

**Opsera** là hệ thống quản lý tuần tra quét mã QR đa tenant (multi-tenant) với các tính năng:
- ✅ Quản lý QR Code với GPS tracking
- ✅ Phân quyền chi tiết theo Role
- ✅ Quản lý Task và Project
- ✅ 3 gói Subscription (STARTER, PRO, ENTERPRISE)
- ✅ Activity Logging đầy đủ
- ✅ Analytics và Reports

---

## 💰 GÓI DỊCH VỤ

| Gói | Giá/tháng | QR Codes | Users | Projects | Storage |
|-----|-----------|----------|-------|----------|---------|
| **STARTER** | 299,000đ | 100 | 5 | 3 | 1GB |
| **PRO** | 899,000đ | 500 | 20 | 15 | 5GB |
| **ENTERPRISE** | 2,499,000đ | 2000 | Unlimited | Unlimited | 20GB |

---

## 🔐 AUTHENTICATION

### 1. Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123",
  "fullName": "Nguyen Van A",
  "tenantName": "My Company"
}
```

### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "fullName": "Nguyen Van A",
    "tenantId": "uuid",
    "isTenantAdmin": true
  }
}
```

---

## 👥 ROLE & PERMISSION MANAGEMENT

### Available Permissions (52 total)
```
USER: CREATE_USER, READ_USER, UPDATE_USER, DELETE_USER, MANAGE_USER
ROLE: CREATE_ROLE, READ_ROLE, UPDATE_ROLE, DELETE_ROLE, MANAGE_ROLE
PROJECT: CREATE_PROJECT, READ_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, MANAGE_PROJECT
QRCODE: CREATE_QRCODE, READ_QRCODE, UPDATE_QRCODE, DELETE_QRCODE, SCAN_QRCODE, MANAGE_QRCODE
TASK: CREATE_TASK, READ_TASK, UPDATE_TASK, DELETE_TASK, ASSIGN_TASK, COMPLETE_TASK, MANAGE_TASK
... và nhiều hơn
```

### 1. Tạo Role
```http
POST /roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Project Manager",
  "permissions": [
    "MANAGE_PROJECT",
    "MANAGE_TASK",
    "READ_USER",
    "READ_QRCODE"
  ]
}
```

### 2. Lấy danh sách Roles
```http
GET /roles
Authorization: Bearer {token}
```

### 3. Xem permissions của mình
```http
GET /roles/my-permissions
Authorization: Bearer {token}
```

---

## 📁 PROJECT MANAGEMENT

### 1. Tạo Project
```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dự án A",
  "description": "Mô tả dự án"
}
```

### 2. Lấy danh sách Projects
```http
GET /projects
Authorization: Bearer {token}
```

### 3. Chi tiết Project (bao gồm QR codes và tasks)
```http
GET /projects/{projectId}
Authorization: Bearer {token}
```

### 4. Update Project
```http
PUT /projects/{projectId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tên mới",
  "description": "Mô tả mới"
}
```

### 5. Xóa Project
```http
DELETE /projects/{projectId}
Authorization: Bearer {token}
```

---

## 📱 QR CODE MANAGEMENT

### 1. Tạo QR Code
```http
POST /qrcodes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "QR Code Tầng 1",
  "location": "Tầng 1 - Phòng A101",
  "projectId": "uuid"
}
```

**Response:** QR code với `data` field chứa mã unique để quét

### 2. Lấy danh sách QR Codes
```http
GET /qrcodes
Authorization: Bearer {token}
```

### 3. Chi tiết QR Code
```http
GET /qrcodes/{qrcodeId}
Authorization: Bearer {token}
```

### 4. Update QR Code
```http
PUT /qrcodes/{qrcodeId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "QR Code mới",
  "location": "Vị trí mới",
  "isActive": true
}
```

### 5. Xóa QR Code
```http
DELETE /qrcodes/{qrcodeId}
Authorization: Bearer {token}
```

---

## ✅ TASK MANAGEMENT

### 1. Tạo Task
```http
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Kiểm tra thiết bị",
  "description": "Kiểm tra tất cả thiết bị tầng 1",
  "projectId": "uuid",
  "assigneeId": "uuid",
  "deadline": "2025-11-01T00:00:00Z"
}
```

### 2. Lấy danh sách Tasks
```http
GET /tasks?status=PENDING&projectId=uuid
Authorization: Bearer {token}
```

**Query params:**
- `status`: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `userId`: Lọc theo người được giao
- `projectId`: Lọc theo dự án

### 3. Lấy tasks của mình
```http
GET /tasks/my-tasks?status=PENDING
Authorization: Bearer {token}
```

### 4. Update Task
```http
PUT /tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Tiêu đề mới",
  "status": "IN_PROGRESS",
  "deadline": "2025-11-05T00:00:00Z"
}
```

### 5. Giao Task cho user
```http
PATCH /tasks/{taskId}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assigneeId": "uuid"
}
```

### 6. Hoàn thành Task
```http
PATCH /tasks/{taskId}/complete
Authorization: Bearer {token}
```

### 7. Xóa Task
```http
DELETE /tasks/{taskId}
Authorization: Bearer {token}
```

---

## 📸 QR CODE SCANNING với GPS

### 1. Quét QR Code (YÊU CẦU GPS)
```http
POST /scan-logs
Authorization: Bearer {token}
Content-Type: application/json

{
  "qrCodeId": "uuid",
  "notes": "Đã kiểm tra, mọi thứ bình thường",
  "attachments": [
    "https://storage.com/image1.jpg",
    "https://storage.com/image2.jpg"
  ],
  "latitude": 10.7769,
  "longitude": 106.7009,
  "accuracy": 15.5
}
```

**Lưu ý:**
- ✅ User phải di chuyển tối thiểu **50m** từ vị trí quét trước
- ✅ GPS accuracy được lưu lại
- ✅ Có thể đính kèm nhiều ảnh

### 2. Lịch sử quét của mình
```http
GET /scan-logs/my-scans?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {token}
```

### 3. Lịch sử quét của 1 QR code
```http
GET /scan-logs/qrcode/{qrcodeId}/history
Authorization: Bearer {token}
```

### 4. Lấy tất cả scan logs (có filter)
```http
GET /scan-logs?qrCodeId=uuid&userId=uuid&startDate=2025-10-01
Authorization: Bearer {token}
```

### 5. Statistics về Scan Logs
```http
GET /scan-logs/statistics?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalScans": 1250,
  "uniqueUsers": 25,
  "uniqueQrCodes": 45,
  "topQrCodes": [
    {
      "qrCode": { "id": "uuid", "name": "QR Tầng 1" },
      "scanCount": 150
    }
  ]
}
```

---

## 📝 ACTIVITY LOGS (Audit Trail)

### 1. Lấy Activity Logs (với filter)
```http
GET /activity-logs?userId=uuid&action=USER_LOGIN&startDate=2025-10-01
Authorization: Bearer {token}
```

**Query params:**
- `userId`: Lọc theo user
- `action`: USER_LOGIN, QRCODE_SCAN, TASK_CREATE, etc.
- `startDate`, `endDate`: Lọc theo thời gian
- `limit`: Giới hạn kết quả (default 100)

### 2. Lịch sử hoạt động của mình
```http
GET /activity-logs/my-history?limit=50
Authorization: Bearer {token}
```

### 3. Lịch sử hoạt động của 1 user
```http
GET /activity-logs/user/{userId}
Authorization: Bearer {token}
```

### 4. Statistics về Activities
```http
GET /activity-logs/statistics?startDate=2025-10-01
Authorization: Bearer {token}
```

### 5. Search Activities
```http
GET /activity-logs/search?q=login&limit=50
Authorization: Bearer {token}
```

---

## 💳 SUBSCRIPTION & PAYMENT

### 1. Xem gói hiện tại
```http
GET /subscription/current
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "My Company"
  },
  "currentPlan": "STARTER",
  "limits": {
    "qrCodes": 100,
    "users": 5,
    "projects": 3,
    "storage": 1,
    "pricePerMonth": 299000
  },
  "usage": {
    "qrCodes": 45,
    "users": 3,
    "projects": 2
  },
  "subscription": {
    "expiresAt": "2025-11-25T00:00:00Z",
    "daysRemaining": 30,
    "isExpired": false
  }
}
```

### 2. Xem tất cả gói
```http
GET /subscription/plans
```

### 3. Nâng cấp gói
```http
POST /subscription/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPlan": "PRO",
  "paymentMethod": "momo",
  "transactionId": "MOMO123456789",
  "paymentProof": "https://storage.com/payment-proof.jpg"
}
```

**Payment Methods:**
- `bank_transfer`: Chuyển khoản ngân hàng
- `momo`: Ví MoMo
- `visa`: Thẻ Visa
- `credit_card`: Thẻ tín dụng/ghi nợ

### 4. Gia hạn Subscription
```http
POST /subscription/renew?months=3
Authorization: Bearer {token}
```

### 5. Kiểm tra giới hạn
```http
GET /subscription/check-limit/qrCodes
Authorization: Bearer {token}
```

**Response:**
```json
{
  "allowed": true,
  "current": 45,
  "limit": 100,
  "plan": "STARTER"
}
```

### 6. Lịch sử thanh toán
```http
GET /subscription/payment-history
Authorization: Bearer {token}
```

---

## 🎯 PERMISSIONS MATRIX

### TENANT_ADMIN (Admin của tổ chức)
✅ Tất cả quyền trong tenant
✅ Quản lý Subscription
✅ Tạo và xóa Users, Roles
✅ Xem tất cả Activity Logs

### PROJECT_MANAGER
✅ Quản lý Projects, Tasks
✅ Tạo và quản lý QR Codes
✅ Xem Reports và Analytics
✅ Giao và theo dõi Tasks
❌ Không quản lý Users và Roles

### SCANNER (Nhân viên quét mã)
✅ Quét QR Codes
✅ Xem và làm Tasks được giao
✅ Upload ảnh đính kèm
❌ Không tạo QR Codes
❌ Không tạo Tasks

### STAFF (Nhân viên văn phòng)
✅ Xem Projects, QR Codes, Tasks
✅ Tạo và update Tasks
✅ Xem Reports
❌ Không quản lý QR Codes
❌ Không xóa Projects

### VIEWER (Chỉ xem)
✅ Xem Projects, QR Codes, Tasks, Reports
❌ Không thể tạo, sửa, xóa gì cả

---

## 🚦 STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | OK - Request thành công |
| 201 | Created - Tạo resource thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập hoặc token hết hạn |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Resource không tồn tại |
| 409 | Conflict - Dữ liệu bị trùng lặp |
| 500 | Internal Server Error - Lỗi server |

---

## 🔧 TESTING với Postman/Thunder Client

### 1. Import Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "token": "{{access_token từ login}}"
}
```

### 2. Test Flow cơ bản:

**Bước 1: Register & Login**
```
POST {{baseUrl}}/auth/register
POST {{baseUrl}}/auth/login
→ Lưu access_token
```

**Bước 2: Tạo Role cho nhân viên**
```
POST {{baseUrl}}/roles
Authorization: Bearer {{token}}
```

**Bước 3: Tạo Project**
```
POST {{baseUrl}}/projects
```

**Bước 4: Tạo QR Codes trong Project**
```
POST {{baseUrl}}/qrcodes
```

**Bước 5: Tạo Task**
```
POST {{baseUrl}}/tasks
```

**Bước 6: Quét QR Code (với GPS)**
```
POST {{baseUrl}}/scan-logs
```

**Bước 7: Xem Statistics**
```
GET {{baseUrl}}/scan-logs/statistics
GET {{baseUrl}}/activity-logs/statistics
GET {{baseUrl}}/subscription/current
```

---

## 📱 MOBILE APP INTEGRATION

### GPS Requirements:
- **Accuracy**: < 50 meters
- **Permission**: Location permission cần được enable
- **Movement**: User phải di chuyển tối thiểu 50m giữa các lần quét

### QR Scanner:
- Sử dụng `html5-qrcode` hoặc native camera
- Scan QR code để lấy `data` field
- Gửi `data` cùng GPS coordinates lên API

### Sample Mobile Flow:
```javascript
// 1. Scan QR Code
const qrData = await scanQRCode();

// 2. Get GPS location
const location = await getCurrentLocation();

// 3. Create scan log
await fetch('http://api.com/scan-logs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qrCodeId: qrData,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    notes: 'Scanned via mobile app'
  })
});
```

---

## 🎨 NEXT STEPS - FRONTEND

### Giao diện cần thiết:

1. **Auth Pages** ✅
   - Login, Register, Forgot Password

2. **Dashboard** ✅
   - Overview statistics
   - Recent activities
   - Quick actions

3. **Project Management** ✅
   - List, Create, Edit, Delete projects
   - View project details with QR codes và tasks

4. **QR Code Management** ✅
   - Generate QR codes
   - Print QR codes
   - View scan history

5. **Task Board** ✅
   - Kanban view (PENDING, IN_PROGRESS, COMPLETED)
   - Create, assign tasks
   - Task details với comments

6. **QR Scanner** ✅
   - Camera integration
   - GPS tracking
   - Upload photos

7. **Reports & Analytics** ✅
   - Scan statistics
   - User activity
   - Export CSV/PDF

8. **Settings** ✅
   - Subscription management
   - Role management
   - User management

9. **Admin Panel** (Super Admin) ✅
   - Manage all tenants
   - View system statistics
   - Access any tenant data

---

## 🔐 SUPER ADMIN FEATURES

### Truy cập Super Admin:
- `isSuperAdmin: true` trong database
- Bypass tất cả permission checks
- Có thể xem và sửa data của TẤT CẢ tenants

### Super Admin APIs (TODO - Giai đoạn 2):
```http
GET /admin/tenants - Liệt kê tất cả tenants
GET /admin/tenants/{tenantId} - Xem chi tiết 1 tenant
PUT /admin/tenants/{tenantId} - Sửa thông tin tenant
DELETE /admin/tenants/{tenantId} - Xóa tenant
GET /admin/statistics - Statistics toàn hệ thống
```

---

## 📞 SUPPORT & CONTACT

- **Email**: support@opsera.vn
- **Phone**: 1900-xxxx
- **Documentation**: https://docs.opsera.vn
- **Status Page**: https://status.opsera.vn

---

**Version**: 1.0.0
**Last Updated**: October 25, 2025
**Author**: Opsera Development Team
