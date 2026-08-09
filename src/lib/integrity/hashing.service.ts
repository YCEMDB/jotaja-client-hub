import { createHash } from 'crypto';
import { CanonicalizationService } from './canonicalization.service';

/**
 * Hashing Service
 * Provides cryptographic hashing for integrity verification.
 */
export class HashingService {
  /**
   * Generates a SHA-256 hash of a canonicalized payload.
   */
  static hashPayload(payload: any, options: { excludeFields?: string[] } = {}): string {
    const canonical = CanonicalizationService.canonicalize(payload, options);
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Generates a chained hash: hash(previousHash + currentPayloadHash)
   */
  static chainHash(previousHash: string, payloadHash: string): string {
    return createHash('sha256')
      .update(previousHash + payloadHash)
      .digest('hex');
  }

  /**
   * Generates a genesis hash for a new chain.
   */
  static generateGenesisHash(metadata: any = {}): string {
    const seed = JSON.stringify({
      seed: 'mesivo_genesis_v1',
      timestamp: new Date().toISOString(),
      ...metadata
    });
    return createHash('sha256').update(seed).digest('hex');
  }
}
