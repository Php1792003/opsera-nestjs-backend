import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.isSuperAdmin === true) {
      return true;
    }

    throw new ForbiddenException(
      'Access denied. Super administrator role required.',
    );
  }
}
