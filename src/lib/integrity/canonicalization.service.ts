/**
 * Canonicalization Service
 * Normalizes objects to ensure consistent hashing.
 */
export class CanonicalizationService {
  /**
   * Normalizes an object for deterministic hashing.
   * - Sorts keys alphabetically.
   * - Normalizes timestamps to ISO strings.
   * - Removes volatile fields like 'updated_at' if specified.
   */
  static canonicalize(data: any, options: { excludeFields?: string[] } = {}): string {
    if (data === null) return 'null';
    if (typeof data !== 'object') return String(data);

    const excludeFields = options.excludeFields || [];
    const keys = Object.keys(data)
      .filter(key => !excludeFields.includes(key))
      .sort();

    const normalized: any = {};
    for (const key of keys) {
      let value = data[key];
      
      // Normalize values
      if (value instanceof Date) {
        value = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        value = JSON.parse(this.canonicalize(value, options));
      }
      
      normalized[key] = value;
    }

    return JSON.stringify(normalized);
  }
}
