export type FinancialTransactionStatus = 'PENDING' | 'SETTLED' | 'FAILED' | 'REVERSED';

export interface FinancialTransaction {
  id: string;
  restaurant_id: string;
  payment_event_id: number;
  provider: string;
  external_payment_id: string;
  amount: number;
  currency: string;
  type: string;
  status: FinancialTransactionStatus;
  created_at: string;
  settled_at?: string;
}

export interface SettlementEvent {
  payment_event_id: number;
  restaurant_id: string;
  provider: string;
  external_payment_id: string;
  amount: number;
  currency: string;
  type: 'CREDIT' | 'DEBIT';
  occurred_at: string;
}

export type ReconciliationStatus = 'MATCHED' | 'DIVERGENT' | 'MISSING_SETTLEMENT';

export interface ReconciliationResult {
  status: ReconciliationStatus;
  financial_transaction_id?: string;
  expected_amount: number;
  received_amount: number;
  difference: number;
  details?: Record<string, any>;
}
