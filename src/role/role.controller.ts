// src/role/role.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  constructor(private readonly roleService: RoleService) { }

  @Post()
  @Permissions(Permission.CREATE_ROLE)
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.roleService.create(createRoleDto, tenantId, userId);
  }

  @Get()
  @Permissions(Permission.READ_ROLE)
  // === SỬA ĐOẠN NÀY ===
  async findAll(
    @Request() req: RequestWithUser,
    @Query('projectId') projectId?: string,
  ) {
    const { tenantId } = req.user;
    return this.roleService.findAll(tenantId, projectId);
  }

  @Get('permissions/list')
  @Permissions(Permission.READ_ROLE)
  getAvailablePermissions() {
    return {
      permissions: Object.values(Permission),
      description: 'List of all available permissions in the system',
    };
  }

  @Get('my-permissions')
  async getMyPermissions(@Request() req: RequestWithUser) {
    const { userId, isSuperAdmin } = req.user;
    const permissions = await this.roleService.getUserPermissions(userId);
    return {
      userId,
      permissions,
      isSuperAdmin,
    };
  }

  @Get(':id')
  @Permissions(Permission.READ_ROLE)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const { tenantId } = req.user;
    return this.roleService.findOne(id, tenantId);
  }

  @Get(':id/members')
  @Permissions(Permission.READ_ROLE)
  async findMembersByRole(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId } = req.user;
    return this.roleService.findMembersByRole(id, tenantId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_ROLE)
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;
    return this.roleService.update(id, updateRoleDto, tenantId, userId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_ROLE)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const { tenantId, userId } = req.user;
    return this.roleService.delete(id, tenantId, userId);
  }
}
