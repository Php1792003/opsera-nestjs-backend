import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    tenantId: string;
    isSuperAdmin: boolean;
  };
}
