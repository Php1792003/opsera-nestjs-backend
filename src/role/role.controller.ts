import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permission } from './constants/permissions.constant';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions(Permission.CREATE_ROLE, Permission.MANAGE_ROLE)
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.roleService.create(createRoleDto, tenantId);
  }

  @Get()
  @Permissions(Permission.READ_ROLE, Permission.MANAGE_ROLE)
  async findAll(@Request() req: RequestWithUser): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.roleService.findAll(tenantId);
  }

  @Get('permissions/list')
  @Permissions(Permission.READ_ROLE, Permission.MANAGE_ROLE)
  getAvailablePermissions(): any {
    return {
      permissions: Object.values(Permission),
      description: 'List of all available permissions in the system',
    };
  }

  @Get('my-permissions')
  async getMyPermissions(@Request() req: RequestWithUser): Promise<any> {
    const userId = req.user.userId;
    const permissions = await this.roleService.getUserPermissions(userId);
    return {
      userId: userId,
      permissions: permissions,
      isSuperAdmin: req.user.isSuperAdmin,
    };
  }

  @Get(':id')
  @Permissions(Permission.READ_ROLE, Permission.MANAGE_ROLE)
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.roleService.findOne(id, tenantId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_ROLE, Permission.MANAGE_ROLE)
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.roleService.update(id, updateRoleDto, tenantId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_ROLE, Permission.MANAGE_ROLE)
  async delete(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const tenantId = req.user.tenantId;

    return this.roleService.delete(id, tenantId);
  }
}
