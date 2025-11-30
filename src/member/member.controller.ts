import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe, // Nên dùng Pipe này để validate ID chuẩn UUID
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { Permission } from '../role/constants/permissions.constant';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  @Post()
  @Permissions(Permission.CREATE_USER)
  create(
    @Body() createMemberDto: CreateMemberDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;

    // QUAN TRỌNG: Gán tenantId từ user đang đăng nhập vào DTO
    // Điều này fix lỗi "tenantId should not be empty"
    createMemberDto.tenantId = tenantId;

    return this.memberService.create(createMemberDto, tenantId, userId);
  }

  @Get()
  @Permissions(Permission.READ_USER)
  findAll(
    @Request() req: RequestWithUser,
    @Query('projectId') projectId?: string,
  ) {
    const { tenantId } = req.user;
    return this.memberService.findAll(tenantId, projectId);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_USER)
  update(
    @Param('id', ParseUUIDPipe) id: string, // Thêm ParseUUIDPipe cho an toàn
    @Body() updateMemberDto: UpdateMemberDto,
    @Request() req: RequestWithUser,
  ) {
    const { tenantId, userId } = req.user;

    updateMemberDto.tenantId = tenantId;

    return this.memberService.update(id, updateMemberDto, tenantId, userId);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_USER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser
  ) {
    const { tenantId, userId } = req.user;
    return this.memberService.remove(id, tenantId, userId);
  }
}