import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MasterAdminService } from './master-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('master-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class MasterAdminController {
  constructor(private readonly masterAdminService: MasterAdminService) { }

  @Get('tenants')
  findAllTenants() {
    return this.masterAdminService.findAllTenants();
  }

  @Get('tenants/:id')
  findOneTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.masterAdminService.findOneTenant(id);
  }

  @Put('tenants/:id')
  updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.masterAdminService.updateTenant(id, updateTenantDto);
  }

  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.masterAdminService.impersonateUser(userId);
  }
}
