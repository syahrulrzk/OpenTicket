import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser, AuditLog } from '../../common/decorators/roles.decorator';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT')
  @ApiOperation({ summary: 'Get ticket aggregate stats' })
  async getStats() {
    return this.ticketsService.getStats();
  }

  @Get('categories')
  @ApiOperation({ summary: 'List ticket categories' })
  async getCategories() {
    return this.ticketsService.getCategories();
  }

  @Get('assignees')
  @Roles('SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT')
  @ApiOperation({ summary: 'List assignable users' })
  async getAssignableUsers() {
    return this.ticketsService.getAssignableUsers();
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Body() dto: any) {
    return this.ticketsService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.ticketsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return this.ticketsService.deleteCategory(id);
  }

  @Get()
  @ApiOperation({ summary: 'List tickets with filters' })
  async findAll(@Query() query: any, @CurrentUser() user: any) {
    const params: any = { ...query };
    if (user.role === 'USER') params.requesterId = user.id;
    return this.ticketsService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail' })
  async findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  @AuditLog('ticket')
  async create(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.ticketsService.create({ ...dto, requesterId: userId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @AuditLog('ticket')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'IT_MANAGER')
  @ApiOperation({ summary: 'Delete/cancel ticket' })
  async remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Patch(':id/assign')
  @Roles('SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT')
  @ApiOperation({ summary: 'Assign ticket to engineer' })
  async assign(@Param('id') id: string, @Body() dto: { assigneeId: string }, @CurrentUser('id') userId: string) {
    return this.ticketsService.assign(id, dto.assigneeId, userId);
  }

  @Patch(':id/reassign')
  @Roles('SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT')
  @ApiOperation({ summary: 'Reassign ticket' })
  async reassign(@Param('id') id: string, @Body() dto: { assigneeId: string }, @CurrentUser('id') userId: string) {
    return this.ticketsService.reassign(id, dto.assigneeId, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change ticket status' })
  async changeStatus(@Param('id') id: string, @Body() dto: { status: string }, @CurrentUser('id') userId: string) {
    return this.ticketsService.changeStatus(id, dto.status as any, userId);
  }

  @Patch(':id/priority')
  @Roles('SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT')
  @ApiOperation({ summary: 'Change ticket priority' })
  async changePriority(@Param('id') id: string, @Body() dto: { priority: string }, @CurrentUser('id') userId: string) {
    return this.ticketsService.changePriority(id, dto.priority as any, userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get ticket comments' })
  async getComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.getComments(id, user.id, user.role);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment' })
  @AuditLog('ticket')
  async addComment(@Param('id') id: string, @Body() dto: { content: string; isInternal?: boolean }, @CurrentUser() user: any) {
    return this.ticketsService.addComment(id, user.id, dto.content, dto.isInternal && user.role !== 'USER');
  }

  @Patch(':id/comments/:cid')
  @ApiOperation({ summary: 'Edit comment' })
  async updateComment(@Param('cid') cid: string, @Body() dto: { content: string }, @CurrentUser('id') userId: string) {
    return this.ticketsService.updateComment(cid, userId, dto.content);
  }

  @Delete(':id/comments/:cid')
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@Param('cid') cid: string, @CurrentUser('id') userId: string) {
    return this.ticketsService.deleteComment(cid, userId);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'List attachments' })
  async getAttachments(@Param('id') id: string) {
    return this.ticketsService.getAttachments(id);
  }

  @Post(':id/attachments')
  @AuditLog('ticket')
  @ApiOperation({ summary: 'Upload attachment' })
  async addAttachment(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.ticketsService.addAttachment(id, userId, dto);
  }

  @Delete(':id/attachments/:aid')
  @ApiOperation({ summary: 'Delete attachment' })
  async deleteAttachment(@Param('aid') aid: string) {
    return this.ticketsService.deleteAttachment(aid);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get ticket timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.ticketsService.getTimeline(id);
  }
}