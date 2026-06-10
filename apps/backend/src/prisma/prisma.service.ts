import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');

    // Soft delete middleware
    this.$use(async (params, next) => {
      const softDeleteModels = ['User', 'Ticket', 'Asset', 'KnowledgeArticle', 'TicketComment'];
      
      if (softDeleteModels.includes(params.model ?? '')) {
        // Intercept findMany and findFirst to filter out deleted records
        if (params.action === 'findMany' || params.action === 'findFirst') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
        
        // Intercept delete to perform soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }
        
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (!params.args.data) params.args.data = {};
          params.args.data.deletedAt = new Date();
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}