export enum Permission {
  // User permissions
  CREATE_USER = 'CREATE_USER',
  VIEW_USERS = 'VIEW_USERS',
  READ_USER = 'READ_USER',
  EDIT_USER = 'EDIT_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  MANAGE_USER = 'MANAGE_USER',

  // Role permissions
  CREATE_ROLE = 'CREATE_ROLE',
  VIEW_ROLES = 'VIEW_ROLES',
  READ_ROLE = 'READ_ROLE',
  EDIT_ROLE = 'EDIT_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  MANAGE_ROLE = 'MANAGE_ROLE',

  // Project permissions
  CREATE_PROJECT = 'CREATE_PROJECT',
  VIEW_PROJECTS = 'VIEW_PROJECTS',
  READ_PROJECT = 'READ_PROJECT',
  EDIT_PROJECT = 'EDIT_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  MANAGE_PROJECT = 'MANAGE_PROJECT',

  // QR Code permissions
  CREATE_QR = 'CREATE_QR',
  CREATE_QRCODE = 'CREATE_QRCODE',
  VIEW_QR = 'VIEW_QR',
  READ_QRCODE = 'READ_QRCODE',
  EDIT_QR = 'EDIT_QR',
  UPDATE_QRCODE = 'UPDATE_QRCODE',
  DELETE_QR = 'DELETE_QR',
  DELETE_QRCODE = 'DELETE_QRCODE',
  SCAN_QR = 'SCAN_QR',
  SCAN_QRCODE = 'SCAN_QRCODE',
  MANAGE_QRCODE = 'MANAGE_QRCODE',

  // Task permissions
  CREATE_TASK = 'CREATE_TASK',
  VIEW_TASKS = 'VIEW_TASKS',
  READ_TASK = 'READ_TASK',
  EDIT_TASK = 'EDIT_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  COMPLETE_TASK = 'COMPLETE_TASK',
  MANAGE_TASK = 'MANAGE_TASK',

  // Reports & Analytics
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',

  // Audit Logs
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  VIEW_ACTIVITY_LOGS = 'VIEW_ACTIVITY_LOGS',
  VIEW_MASTER_AUDIT_LOGS = 'VIEW_MASTER_AUDIT_LOGS',
  VIEW_ALL_AUDIT_LOGS = 'VIEW_ALL_AUDIT_LOGS',
  EXPORT_ACTIVITY_LOGS = 'EXPORT_ACTIVITY_LOGS',

  // Scan Logs
  VIEW_SCAN_LOGS = 'VIEW_SCAN_LOGS',
  CREATE_SCAN_LOG = 'CREATE_SCAN_LOG',
  MANAGE_SCAN_LOGS = 'MANAGE_SCAN_LOGS',

  // System & Tenant
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  MANAGE_TENANT_SETTINGS = 'MANAGE_TENANT_SETTINGS',
  VIEW_TENANT_SETTINGS = 'VIEW_TENANT_SETTINGS',
  MANAGE_SUBSCRIPTION = 'MANAGE_SUBSCRIPTION',
}

export const DEFAULT_ROLE_PERMISSIONS = {
  TENANT_ADMIN: Object.values(Permission),

  PROJECT_MANAGER: [
    Permission.VIEW_USERS,
    Permission.MANAGE_PROJECT,
    Permission.CREATE_PROJECT,
    Permission.VIEW_PROJECTS,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.MANAGE_TASK,
    Permission.CREATE_TASK,
    Permission.VIEW_TASKS,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.COMPLETE_TASK,
    Permission.VIEW_QR,
    Permission.CREATE_QRCODE,
    Permission.UPDATE_QRCODE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_SCAN_LOGS,
    Permission.MANAGE_SCAN_LOGS,
  ],

  SCANNER: [
    Permission.VIEW_QR,
    Permission.SCAN_QR,
    Permission.CREATE_SCAN_LOG,
    Permission.VIEW_TASKS,
    Permission.EDIT_TASK,
    Permission.COMPLETE_TASK,
  ],

  STAFF: [
    Permission.VIEW_USERS,
    Permission.VIEW_PROJECTS,
    Permission.VIEW_QR,
    Permission.VIEW_TASKS,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.COMPLETE_TASK,
    Permission.VIEW_REPORTS,
  ],

  VIEWER: [
    Permission.VIEW_PROJECTS,
    Permission.VIEW_QR,
    Permission.VIEW_TASKS,
    Permission.VIEW_REPORTS,
  ],
};

export function permissionsToString(permissions: Permission[]): string {
  return permissions.join(',');
}

export function stringToPermissions(permissionsStr: string): Permission[] {
  if (!permissionsStr || permissionsStr.trim() === '') {
    return [];
  }
  return permissionsStr
    .split(',')
    .filter((p) => p.trim() !== '') as Permission[];
}

export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission,
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
}

export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
}
