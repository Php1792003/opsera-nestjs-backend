import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  Permission,
  hasAnyPermission,
} from '../constants/permissions.constant';
import { RoleService } from '../role.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = request.user as { userId: string; isSuperAdmin: boolean };

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admin bypass all permission checks
    if (user.isSuperAdmin) {
      return true;
    }

    // Get user permissions
    const userPermissions = await this.roleService.getUserPermissions(
      user.userId,
    );

    // Check if user has any of the required permissions
    const hasPermission = hasAnyPermission(
      userPermissions,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
