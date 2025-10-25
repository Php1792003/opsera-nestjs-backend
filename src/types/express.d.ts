interface UserPayload {
  userId: string;
  tenantId: string;
  isSuperAdmin: boolean;
}

declare namespace Express {
  export interface Request {
    user?: UserPayload;
  }
}
