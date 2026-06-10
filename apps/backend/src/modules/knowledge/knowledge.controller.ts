import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Get('suggest')
  @ApiOperation({ summary: 'Suggest knowledge articles' })
  async suggest(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.knowledgeService.suggest(q || '', limit ? parseInt(limit, 10) : 5);
  }
}
