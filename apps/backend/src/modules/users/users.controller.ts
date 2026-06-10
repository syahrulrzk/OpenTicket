import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'List all users' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('department') department?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      role, department,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() dto: { email: string; username: string; password: string; role?: string; department?: string }) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Change user role (SUPER_ADMIN only)' })
  async updateRole(@Param('id') id: string, @Body() dto: { role: string }) {
    return this.usersService.update(id, { role: dto.role });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete user (SUPER_ADMIN only)' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin force reset password' })
  async resetPassword(@Param('id') id: string, @Body() dto: { newPassword: string }) {
    return this.usersService.resetPassword(id, dto.newPassword);
  }

  @Get(':id/tickets')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Get tickets by user' })
  async getUserTickets(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.getUserTickets(id, { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 });
  }

  @Get(':id/activity')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Get user activity log' })
  async getUserActivity(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.getUserActivity(id, { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 });
  }
}