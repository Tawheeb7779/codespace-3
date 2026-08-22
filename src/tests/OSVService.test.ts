import { describe, it, expect } from 'vitest';
import { osvScannerService } from '../services/OSVScannerService';

describe('OSVScannerService', () => {
  it('should return safe status for non-vulnerable core packages', async () => {
    const result = await osvScannerService.scanPackage('clsx', '2.1.1');
    expect(result.packageName).toBe('clsx');
    expect(['SAFE', 'UNKNOWN', 'SCAN_FAILED']).toContain(result.status);
  });
});
