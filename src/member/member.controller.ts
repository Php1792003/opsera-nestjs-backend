import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Permissions(Permission.CREATE_USER)
  create(
    @Body() createMemberDto: CreateMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.memberService.create(createMemberDto, req.user.tenantId);
  }

  @Get()
  @Permissions(Permission.READ_USER)
  findAll(@Request() req: RequestWithUser) {
    // ✅ ĐÃ SỬA: RequestWith-user -> RequestWithUser
    return this.memberService.findAll(req.user.tenantId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_USER)
  update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.memberService.update(id, updateMemberDto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_USER)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.memberService.remove(id, req.user.tenantId);
  }
}
