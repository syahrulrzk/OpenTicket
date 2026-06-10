import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, TicketPriority, Role } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number | string; limit?: number | string; status?: string; priority?: string;
    categoryId?: string; assigneeId?: string; requesterId?: string;
    slaBreached?: boolean; search?: string; dateFrom?: string; dateTo?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, status, priority, categoryId, assigneeId, requesterId, slaBreached, search, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10;
    const skip = (safePage - 1) * safeLimit;
    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (categoryId) where.categoryId = categoryId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (requesterId) where.requesterId = requesterId;
    if (slaBreached !== undefined) where.slaBreached = slaBreached;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { requester: { username: { contains: search, mode: 'insensitive' } } },
        { requester: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          requester: { select: { id: true, username: true, email: true, avatar: true } },
          assignee: { select: { id: true, username: true, email: true, avatar: true } },
          slaPolicy: { select: { id: true, name: true, responseTimeMinutes: true, resolutionTimeMinutes: true } },
        },
        skip, take: safeLimit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, meta: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }

  async getStats() {
    const [
      total, open, inProgress, resolved, closed,
      critical, high, medium, low,
      slaBreached, resolvedToday,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { deletedAt: null } }),
      this.prisma.ticket.count({ where: { status: 'OPEN', deletedAt: null } }),
      this.prisma.ticket.count({ where: { status: 'IN_PROGRESS', deletedAt: null } }),
      this.prisma.ticket.count({ where: { status: 'RESOLVED', deletedAt: null } }),
      this.prisma.ticket.count({ where: { status: 'CLOSED', deletedAt: null } }),
      this.prisma.ticket.count({ where: { priority: 'CRITICAL', deletedAt: null } }),
      this.prisma.ticket.count({ where: { priority: 'HIGH', deletedAt: null } }),
      this.prisma.ticket.count({ where: { priority: 'MEDIUM', deletedAt: null } }),
      this.prisma.ticket.count({ where: { priority: 'LOW', deletedAt: null } }),
      this.prisma.ticket.count({ where: { slaBreached: true, deletedAt: null } }),
      this.prisma.ticket.count({
        where: { resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, deletedAt: null },
      }),
    ]);

    const topAssigneeAgg = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { assigneeId: { not: null }, deletedAt: null },
      _count: { assigneeId: true },
      orderBy: { _count: { assigneeId: 'desc' } },
      take: 1,
    });

    let topAssignee: { id: string; username: string; email: string; avatar: string | null; count: number } | null = null;
    if (topAssigneeAgg.length && topAssigneeAgg[0].assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: topAssigneeAgg[0].assigneeId },
        select: { id: true, username: true, email: true, avatar: true },
      });
      if (user) {
        topAssignee = { ...user, count: topAssigneeAgg[0]._count.assigneeId };
      }
    }

    const slaCompliance = total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100;

    return { total, open, inProgress, resolved, closed, critical, high, medium, low, slaBreached, resolvedToday, slaCompliance, topAssignee };
  }

  async getAssignableUsers() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        role: { in: ['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT'] },
      },
      select: { id: true, username: true, email: true, avatar: true, role: true },
      orderBy: { username: 'asc' },
    });
  }

  async findById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        requester: { select: { id: true, username: true, email: true, avatar: true, department: true } },
        assignee: { select: { id: true, username: true, email: true, avatar: true } },
        slaPolicy: true,
        comments: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, username: true, avatar: true, role: true } },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: { where: { commentId: null } },
        timeline: {
          include: { actor: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(data: {
    title: string; description: string; priority?: string;
    categoryId?: string; requesterId: string; assigneeId?: string;
  }) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.ticket.count({
      where: { createdAt: { gte: new Date(`${year}-${month}-01`) } },
    });
    const ticketNumber = `TICK-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    // Determine SLA policy based on category or priority
    let slaPolicyId: string | undefined;
    if (data.categoryId) {
      const category = await this.prisma.ticketCategory.findUnique({ where: { id: data.categoryId } });
      if (category?.slaPolicyId) slaPolicyId = category.slaPolicyId;
    }
    if (!slaPolicyId) {
      const defaultSla = await this.prisma.sLAPolicy.findFirst({
        where: { priority: (data.priority as TicketPriority) || 'MEDIUM', isDefault: true },
      });
      if (defaultSla) slaPolicyId = defaultSla.id;
    }

    // Calculate due date from SLA
    let dueAt: Date | undefined;
    if (slaPolicyId) {
      const sla = await this.prisma.sLAPolicy.findUnique({ where: { id: slaPolicyId } });
      if (sla) {
        dueAt = new Date();
        dueAt.setMinutes(dueAt.getMinutes() + sla.resolutionTimeMinutes);
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber, title: data.title, description: data.description,
        priority: (data.priority as TicketPriority) || 'MEDIUM',
        categoryId: data.categoryId, requesterId: data.requesterId,
        assigneeId: data.assigneeId, slaPolicyId, dueAt,
      },
      include: {
        category: true, requester: { select: { id: true, username: true } },
        assignee: { select: { id: true, username: true } },
      },
    });

    // Create timeline entry
    await this.prisma.ticketTimeline.create({
      data: { ticketId: ticket.id, actorId: data.requesterId, action: 'CREATE', toValue: 'OPEN' },
    });

    return ticket;
  }

  async update(id: string, data: { title?: string; description?: string; priority?: string; categoryId?: string }) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const updateData: any = { ...data };
    return this.prisma.ticket.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.ticket.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Ticket deleted' };
  }

  async assign(id: string, assigneeId: string, actorId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const updated = await this.prisma.ticket.update({ where: { id }, data: { assigneeId } });
    await this.prisma.ticketTimeline.create({
      data: { ticketId: id, actorId, action: 'ASSIGN', fromValue: ticket.assigneeId || '', toValue: assigneeId },
    });
    return updated;
  }

  async reassign(id: string, assigneeId: string, actorId: string) {
    return this.assign(id, assigneeId, actorId);
  }

  async changeStatus(id: string, status: TicketStatus, actorId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updateData: any = { status };
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (status === 'CLOSED') updateData.closedAt = new Date();
    if (status === 'IN_PROGRESS' && !ticket.firstResponseAt) updateData.firstResponseAt = new Date();

    const updated = await this.prisma.ticket.update({ where: { id }, data: updateData });
    await this.prisma.ticketTimeline.create({
      data: { ticketId: id, actorId, action: 'STATUS_CHANGE', fromValue: ticket.status, toValue: status },
    });
    return updated;
  }

  async changePriority(id: string, priority: TicketPriority, actorId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const updated = await this.prisma.ticket.update({ where: { id }, data: { priority } });
    await this.prisma.ticketTimeline.create({
      data: { ticketId: id, actorId, action: 'UPDATE', fromValue: ticket.priority, toValue: priority, metadata: { field: 'priority' } },
    });
    return updated;
  }

  async addComment(ticketId: string, authorId: string, content: string, isInternal = false) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const comment = await this.prisma.ticketComment.create({
      data: { ticketId, authorId, content, isInternal },
      include: { author: { select: { id: true, username: true, avatar: true, role: true } } },
    });
    await this.prisma.ticketTimeline.create({
      data: { ticketId, actorId: authorId, action: 'COMMENT', metadata: { commentId: comment.id } },
    });
    return comment;
  }

  async getComments(ticketId: string, userId: string, userRole: string) {
    const where: any = { ticketId, deletedAt: null };
    if (userRole === 'USER') where.isInternal = false;
    return this.prisma.ticketComment.findMany({
      where,
      include: { author: { select: { id: true, username: true, avatar: true, role: true } }, attachments: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.ticketComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    return this.prisma.ticketComment.update({ where: { id: commentId }, data: { content } });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.ticketComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not your comment');
    return this.prisma.ticketComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }

  async getTimeline(ticketId: string) {
    return this.prisma.ticketTimeline.findMany({
      where: { ticketId },
      include: { actor: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCategories() {
    return this.prisma.ticketCategory.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string; description?: string; parentId?: string; slaPolicyId?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.ticketCategory.create({ data: { ...data, slug } });
  }

  async updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean; slaPolicyId?: string }) {
    const updateData: any = { ...data };
    if (data.name) updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.ticketCategory.update({ where: { id }, data: updateData });
  }

  async deleteCategory(id: string) {
    return this.prisma.ticketCategory.update({ where: { id }, data: { isActive: false } });
  }

  async addAttachment(ticketId: string, uploadedById: string, file: { filename: string; originalName: string; mimeType: string; size: number; storagePath: string }) {
    return this.prisma.ticketAttachment.create({
      data: { ...file, ticketId, uploadedById },
    });
  }

  async getAttachments(ticketId: string) {
    return this.prisma.ticketAttachment.findMany({
      where: { ticketId, commentId: null },
      include: { uploader: { select: { id: true, username: true } } },
    });
  }

  async deleteAttachment(attachmentId: string) {
    return this.prisma.ticketAttachment.delete({ where: { id: attachmentId } });
  }
}