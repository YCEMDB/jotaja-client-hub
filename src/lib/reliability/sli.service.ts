import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MetricType, ServiceName, PerformanceMetric, LatencyProfile } from "./reliability-types";

export class SLIService {
  /**
   * Records a new SLI metric
   */
  static async recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<void> {
    const { error } = await (supabaseAdmin.from as any)('performance_metrics')
      .insert({
        ...metric,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording SLI metric:', error);
    }
  }

  /**
   * Calculates latency profile (P50, P95, etc) for a service
   */
  static async getLatencyProfile(
    service: ServiceName, 
    windowInMinutes: number = 60,
    restaurantId?: string
  ): Promise<LatencyProfile | 'INSUFFICIENT_DATA'> {
    const startTime = new Date(Date.now() - windowInMinutes * 60000).toISOString();
    
    let query = (supabaseAdmin.from as any)('performance_metrics')
      .select('value')
      .eq('service_name', service)
      .eq('metric_type', 'LATENCY')
      .gte('timestamp', startTime);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    } else {
      query = query.eq('scope', 'GLOBAL');
    }

    const { data, error } = await query;

    if (error || !data || data.length < 10) {
      return 'INSUFFICIENT_DATA';
    }

    const values = (data as any[]).map(d => d.value).sort((a: number, b: number) => a - b);
    const count = values.length;

    return {
      p50: this.getPercentile(values, 50),
      p75: this.getPercentile(values, 75),
      p90: this.getPercentile(values, 90),
      p95: this.getPercentile(values, 95),
      p99: this.getPercentile(values, 99),
      count
    };
  }

  private static getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[index];
  }

  /**
   * Calculates availability for a service in a given window
   */
  static async getAvailability(
    service: ServiceName,
    windowInMinutes: number = 60,
    restaurantId?: string
  ): Promise<number | 'INSUFFICIENT_DATA'> {
    const startTime = new Date(Date.now() - windowInMinutes * 60000).toISOString();
    
    let query = (supabaseAdmin.from as any)('performance_metrics')
      .select('metric_type, value')
      .eq('service_name', service)
      .in('metric_type', ['SUCCESS_RATE', 'AVAILABILITY'])
      .gte('timestamp', startTime);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return 'INSUFFICIENT_DATA';
    }

    const sum = (data as any[]).reduce((acc, curr) => acc + curr.value, 0);
    return sum / data.length;
  }
}
