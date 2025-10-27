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
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';

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

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user; // Bây giờ 'user' sẽ có kiểu dữ liệu đúng

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const userPermissions = await this.roleService.getUserPermissions(
      user.userId,
    );

    const hasRequiredPermission = hasAnyPermission(
      userPermissions,
      requiredPermissions,
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
