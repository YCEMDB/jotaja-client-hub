import { ReconciliationFinding, ReconciliationFindingSeverity, ReconciliationFindingStatus } from './integrity-types';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

/**
 * Reconciliation Engine
 * Hardens cross-verification between financial entities.
 */
export class ReconciliationEngine {
  /**
   * Verifies consistency between a webhook log and a processed payment.
   */
  static async reconcileWebhookToPayment(webhookId: string) {
    const { data: webhook } = await supabaseAdmin
      .from('payment_provider_webhook_logs')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (!webhook) return;

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_payment_id', webhook.provider_payment_id)
      .single();

    if (!payment) {
      await this.reportFinding({
        restaurant_id: webhook.restaurant_id || '',
        check_type: 'webhook_vs_payment',
        entity_type: 'webhook_log',
        entity_id: webhookId,
        severity: 'high',
        status: 'open',
        divergence_data: { reason: 'Missing payment record for webhook' },
        expected_data: { provider_payment_id: webhook.provider_payment_id },
        actual_data: null
      });
      return;
    }

    // Verify amount and status
    const webhookPayload = webhook.payload as any;
    const expectedAmount = webhookPayload?.amount || webhookPayload?.value;
    
    if (expectedAmount && Number(payment.amount) !== Number(expectedAmount)) {
      await this.reportFinding({
        restaurant_id: payment.restaurant_id,
        check_type: 'webhook_vs_payment',
        entity_type: 'payment',
        entity_id: payment.id,
        severity: 'critical',
        status: 'open',
        divergence_data: { reason: 'Amount mismatch' },
        expected_data: { amount: expectedAmount },
        actual_data: { amount: payment.amount },
        correlation_id: webhookId
      });
    }
  }

  /**
   * Internal helper to report a finding.
   */
  private static async reportFinding(finding: Omit<ReconciliationFinding, 'id' | 'created_at' | 'updated_at' | 'detected_at'>) {
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
