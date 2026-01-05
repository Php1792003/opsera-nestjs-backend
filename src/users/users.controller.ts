import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    UseGuards, Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    getProfile(@Request() req) {
        console.log('User from Request:', req.user);

        const userId = req.user?.sub || req.user?.id || req.user?.userId;

        if (!userId) {
            throw new Error('User ID not found in token payload');
        }

        return this.usersService.getProfile(userId);
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto, @Request() req) {
        return this.usersService.create(createUserDto, req.user.tenantId);
    }

    @Get()
    findAll(@Request() req) {
        return this.usersService.findAll(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.usersService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
        return this.usersService.update(id, updateUserDto, req.user.tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.usersService.remove(id, req.user.tenantId);
    }
}