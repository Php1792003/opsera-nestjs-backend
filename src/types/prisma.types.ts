// Prisma response types
export interface User {
  id: string;
  email: string;
  fullName: string;
  password: string;
  tenantId: string;
  roleId?: string;
  isTenantAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  subscriptionPlan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    qrcodes: number;
    tasks: number;
  };
}

export interface QrCode {
  id: string;
  name: string;
  location?: string;
  data?: string;
  isActive: boolean;
  projectId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
  };
}

export interface Role {
  id: string;
  name: string;
  permissions: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
  };
  users?: Array<{
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
  }>;
}

export interface UserWithRole extends User {
  role?: Role;
}

export interface ProjectWithDetails extends Project {
  qrcodes?: Array<{
    id: string;
    name: string;
    location?: string;
    data?: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    deadline?: Date;
    createdAt: Date;
  }>;
}

export interface QrCodeWithProject extends QrCode {
  project: {
    id: string;
    name: string;
  };
}

export interface RoleWithUsers extends Role {
  users: Array<{
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
  }>;
}

// Role response with permissions as array
export interface RoleResponse {
  id: string;
  name: string;
  permissions: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
  };
  users?: Array<{
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
  }>;
}

// Transaction result types
export interface RegisterResult {
  user: User;
  tenant: Tenant;
}

export interface AuthResult {
  accessToken: string;
}

export interface DeleteResult {
  message: string;
  id: string;
}

export interface PermissionsResult {
  permissions: string[];
  description: string;
}

export interface UserPermissionsResult {
  userId: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
