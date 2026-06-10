import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async suggest(query: string, limit = 5) {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 3) return [];

    const safeLimit = Math.min(Math.max(limit, 1), 10);
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

    const candidates = await this.prisma.knowledgeArticle.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        OR: [
          { title: { contains: trimmed, mode: 'insensitive' } },
          { summary: { contains: trimmed, mode: 'insensitive' } },
          { content: { contains: trimmed, mode: 'insensitive' } },
          { tags: { hasSome: tokens } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        slug: true,
        viewCount: true,
        updatedAt: true,
        tags: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      take: safeLimit * 4,
      orderBy: [{ viewCount: 'desc' }, { updatedAt: 'desc' }],
    });

    const normalizedQuery = trimmed.toLowerCase();

    const scored = candidates.map((article) => {
      const haystackTitle = article.title.toLowerCase();
      const haystackSummary = (article.summary || '').toLowerCase();
      const haystackContent = (article.content || '').toLowerCase();

      // Simple weighted scoring for better relevance ordering.
      let score = 0;
      if (haystackTitle.includes(normalizedQuery)) score += 3;
      if (haystackSummary.includes(normalizedQuery)) score += 2;
      if (haystackContent.includes(normalizedQuery)) score += 1;
      if (tokens.length && article.tags?.some((t) => tokens.includes(t.toLowerCase()))) score += 2;

      score += Math.min(article.viewCount || 0, 50) / 50;

      return { score, ...article };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit)
      .map(({ score, content, tags, viewCount, updatedAt, ...rest }) => rest);
  }
}
