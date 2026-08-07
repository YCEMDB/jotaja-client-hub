import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { FinancialAnalyticsService } from '@/lib/analytics/financial-analytics.service';

const querySchema = z.object({
  restaurantId: z.string().uuid(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const Route = createFileRoute('/api/analytics/financial-summary')({
  validateSearch: (search: Record<string, unknown>) => querySchema.parse(search),
  loader: async (context: any) => {
    const search = context.search;
    const { restaurantId, startDate, endDate } = search;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    try {
      const summary = await FinancialAnalyticsService.getFinancialSummary(restaurantId, start, end);
      return { summary };
    } catch (error: any) {
      return { error: error.message };
    }
  }
});

