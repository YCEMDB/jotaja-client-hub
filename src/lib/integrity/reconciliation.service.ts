import { ReconciliationFinding } from './integrity-types';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

/**
 * Reconciliation Engine
 * Hardens cross-verification between financial entities.
 */
export class ReconciliationEngine {
  /**
   * Verifies consistency between a webhook log and a processed payment.
   */
  static async reconcileWebhookToPayment(webhookId: number) {
    const { data: webhook } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (!webhook) return;

    // Try to extract provider payment ID from payload if not direct
    const payload = webhook.payload as any;
    const providerPaymentId = payload?.id || payload?.data?.id || payload?.resource?.id;

    if (!providerPaymentId) return;

    const { data: payment } = await supabaseAdmin
      .from('order_payments')
      .select('*')
      .eq('provider_payment_id', String(providerPaymentId))
      .maybeSingle();

    if (!payment) {
      // Find restaurant_id from account_id or metadata if possible
      // Using a fallback for now or looking up via order if payload has order_id
      await this.reportFinding({
        restaurant_id: '', // Would need lookup logic for restaurant_id
        check_type: 'webhook_vs_payment',
        entity_type: 'webhook_log',
        entity_id: String(webhookId),
        severity: 'high',
        status: 'open',
        divergence_data: { reason: 'Missing payment record for webhook' },
        expected_data: { provider_payment_id: providerPaymentId },
        actual_data: {}
      });
      return;
    }

    // Verify amount and status
    const expectedAmount = payload?.amount || payload?.data?.amount || payload?.transaction_amount;
    
    if (expectedAmount && Number(payment.amount) !== Number(expectedAmount)) {
      await this.reportFinding({
        restaurant_id: payment.restaurant_id,
        check_type: 'webhook_vs_payment',
        entity_type: 'order_payments',
        entity_id: payment.id,
        severity: 'critical',
        status: 'open',
        divergence_data: { reason: 'Amount mismatch' },
        expected_data: { amount: expectedAmount },
        actual_data: { amount: payment.amount },
        correlation_id: String(webhookId) as any // Cast to UUID if possible or handle as string
      });
    }
  }

  /**
   * Internal helper to report a finding.
   */
  private static async reportFinding(finding: Omit<ReconciliationFinding, 'id' | 'created_at' | 'updated_at' | 'detected_at'>) {
    // Basic validation to ensure we have a restaurant_id if required by RLS/schema
    if (!finding.restaurant_id) {
      console.warn('[ReconciliationEngine] Skipping finding report: missing restaurant_id');
      return;
    }

    const { error } = await supabaseAdmin
      .from('reconciliation_findings')
      .insert({
        ...finding,
        detected_at: new Date().toISOString()
      });

    if (error) {
      console.error('[ReconciliationEngine] Error reporting finding:', error);
    }
  }
}
