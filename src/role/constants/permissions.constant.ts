// Định nghĩa tất cả permissions trong hệ thống
export enum Permission {
  // User Management
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  MANAGE_USER = 'MANAGE_USER', // Full user management

  // Role Management
  CREATE_ROLE = 'CREATE_ROLE',
  READ_ROLE = 'READ_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  MANAGE_ROLE = 'MANAGE_ROLE', // Full role management

  // Project Management
  CREATE_PROJECT = 'CREATE_PROJECT',
  READ_PROJECT = 'READ_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  MANAGE_PROJECT = 'MANAGE_PROJECT', // Full project management

  // QR Code Management
  CREATE_QRCODE = 'CREATE_QRCODE',
  READ_QRCODE = 'READ_QRCODE',
  UPDATE_QRCODE = 'UPDATE_QRCODE',
  DELETE_QRCODE = 'DELETE_QRCODE',
  SCAN_QRCODE = 'SCAN_QRCODE', // Quyền quét QR code
  MANAGE_QRCODE = 'MANAGE_QRCODE', // Full QR code management

  // Task Management
  CREATE_TASK = 'CREATE_TASK',
  READ_TASK = 'READ_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  COMPLETE_TASK = 'COMPLETE_TASK',
  MANAGE_TASK = 'MANAGE_TASK', // Full task management

  // Report & Analytics
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',

  // Activity Logs
  VIEW_ACTIVITY_LOGS = 'VIEW_ACTIVITY_LOGS',
  EXPORT_ACTIVITY_LOGS = 'EXPORT_ACTIVITY_LOGS',

  // Scan Logs
  VIEW_SCAN_LOGS = 'VIEW_SCAN_LOGS',
  CREATE_SCAN_LOG = 'CREATE_SCAN_LOG',
  MANAGE_SCAN_LOGS = 'MANAGE_SCAN_LOGS',

  // Tenant Settings (for tenant admin)
  MANAGE_TENANT_SETTINGS = 'MANAGE_TENANT_SETTINGS',
  VIEW_TENANT_SETTINGS = 'VIEW_TENANT_SETTINGS',
}

// Nhóm permissions theo vai trò mặc định
export const DEFAULT_ROLE_PERMISSIONS = {
  // Admin của tenant - toàn quyền
  TENANT_ADMIN: Object.values(Permission),

  // Quản lý dự án
  PROJECT_MANAGER: [
    Permission.READ_USER,
    Permission.MANAGE_PROJECT,
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.MANAGE_TASK,
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.COMPLETE_TASK,
    Permission.READ_QRCODE,
    Permission.CREATE_QRCODE,
    Permission.UPDATE_QRCODE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ACTIVITY_LOGS,
    Permission.VIEW_SCAN_LOGS,
    Permission.MANAGE_SCAN_LOGS,
  ],

  // Nhân viên quét mã
  SCANNER: [
    Permission.READ_QRCODE,
    Permission.SCAN_QRCODE,
    Permission.CREATE_SCAN_LOG,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.COMPLETE_TASK,
  ],

  // Nhân viên văn phòng
  STAFF: [
    Permission.READ_USER,
    Permission.READ_PROJECT,
    Permission.READ_QRCODE,
    Permission.READ_TASK,
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK,
    Permission.COMPLETE_TASK,
    Permission.VIEW_REPORTS,
  ],

  // Chỉ xem
  VIEWER: [
    Permission.READ_PROJECT,
    Permission.READ_QRCODE,
    Permission.READ_TASK,
    Permission.VIEW_REPORTS,
  ],
};

// Helper function để convert permissions array thành string
export function permissionsToString(permissions: Permission[]): string {
  return permissions.join(',');
}

// Helper function để convert permissions string thành array
export function stringToPermissions(permissionsStr: string): Permission[] {
  if (!permissionsStr || permissionsStr.trim() === '') {
    return [];
  }
  return permissionsStr.split(',').filter(p => p.trim() !== '') as Permission[];
}

// Kiểm tra user có permission không
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

// Kiểm tra user có ít nhất 1 trong các permissions
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Kiểm tra user có tất cả permissions
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
