import { HashingService } from './hashing.service';
import { IntegrityChainType, IntegrityRecord, IntegrityStatus, VerificationResult } from './integrity-types';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

/**
 * Integrity Service
 * Manages hash chains and records for audit proof.
 */
export class IntegrityService {
  /**
   * Records an audit event in a chain.
   */
  static async recordIntegrity(params: {
    restaurant_id: string;
    chain_type: IntegrityChainType;
    entity_type: string;
    entity_id: string;
    payload: any;
    metadata?: any;
  }) {
    // 1. Get or create active chain
    let chain = await this.getActiveChain(params.restaurant_id, params.chain_type);
    
    if (!chain) {
      chain = await this.createChain(params.restaurant_id, params.chain_type);
    }

    // 2. Get last record to compute chain hash
    const lastRecord = await this.getLastRecord(chain.id);
    const previousHash = lastRecord ? lastRecord.current_hash : chain.genesis_hash;
    const sequenceNumber = lastRecord ? Number(lastRecord.sequence_number) + 1 : 1;

    // 3. Compute hashes
    const payloadHash = HashingService.hashPayload(params.payload);
    const currentHash = HashingService.chainHash(previousHash, payloadHash);

    // 4. Persist record
    const { data, error } = await supabaseAdmin
      .from('integrity_records')
      .insert({
        chain_id: chain.id,
        restaurant_id: params.restaurant_id,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        payload_hash: payloadHash,
        previous_hash: previousHash,
        current_hash: currentHash,
        sequence_number: sequenceNumber,
        metadata: params.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('[IntegrityService] Error recording integrity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Verifies a chain integrity.
   */
  static async verifyChain(chainId: string): Promise<VerificationResult> {
    const startTime = Date.now();
    
    const { data: records, error } = await supabaseAdmin
      .from('integrity_records')
      .select('*')
      .eq('chain_id', chainId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;

    const { data: chain } = await supabaseAdmin
      .from('integrity_chains')
      .select('*')
      .eq('id', chainId)
      .single();

    if (!chain) throw new Error('Chain not found');

    let expectedPreviousHash = chain.genesis_hash;
    let lastVerifiedSequence = 0;

    for (const record of (records || [])) {
      // 1. Check sequence
      if (Number(record.sequence_number) !== lastVerifiedSequence + 1) {
        return {
          status: 'broken',
          error_details: {
            reason: 'Sequence gap detected',
            expected: lastVerifiedSequence + 1,
            actual: record.sequence_number,
            record_id: record.id
          },
          last_verified_sequence: lastVerifiedSequence,
          duration_ms: Date.now() - startTime
        };
      }

      // 2. Check hash link
      if (record.previous_hash !== expectedPreviousHash) {
        return {
          status: 'invalid',
          error_details: {
            reason: 'Chain link broken',
            record_id: record.id,
            expected_previous: expectedPreviousHash,
            actual_previous: record.previous_hash
          },
          last_verified_sequence: lastVerifiedSequence,
          duration_ms: Date.now() - startTime
        };
      }

      // 3. Verify current hash (re-compute)
      const computedHash = HashingService.chainHash(record.previous_hash, record.payload_hash);
      if (record.current_hash !== computedHash) {
        return {
          status: 'invalid',
          error_details: {
            reason: 'Current hash mismatch',
            record_id: record.id,
            computed: computedHash,
            stored: record.current_hash
          },
          last_verified_sequence: lastVerifiedSequence,
          duration_ms: Date.now() - startTime
        };
      }

      expectedPreviousHash = record.current_hash;
      lastVerifiedSequence = Number(record.sequence_number);
    }

    const result: VerificationResult = {
      status: records?.length ? 'valid' : 'incomplete',
      last_verified_sequence: lastVerifiedSequence,
      duration_ms: Date.now() - startTime
    };

    // Log verification
    await supabaseAdmin.from('integrity_verification_logs').insert({
      chain_id: chainId,
      restaurant_id: chain.restaurant_id || '', // Ensure non-null string
      status: result.status,
      error_details: result.error_details,
      last_verified_sequence: lastVerifiedSequence,
      verification_duration_ms: result.duration_ms
    });

    return result;
  }

  private static async getActiveChain(restaurantId: string, chainType: IntegrityChainType) {
    const { data } = await supabaseAdmin
      .from('integrity_chains')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('chain_type', chainType)
      .eq('is_active', true)
      .single();
    return data;
  }

  private static async createChain(restaurantId: string, chainType: IntegrityChainType) {
    const genesisHash = HashingService.generateGenesisHash({ restaurantId, chainType });
    const { data, error } = await supabaseAdmin
      .from('integrity_chains')
      .insert({
        restaurant_id: restaurantId,
        chain_type: chainType,
        genesis_hash: genesisHash,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  private static async getLastRecord(chainId: string) {
    const { data } = await supabaseAdmin
      .from('integrity_records')
      .select('*')
      .eq('chain_id', chainId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();
    return data;
  }
}
