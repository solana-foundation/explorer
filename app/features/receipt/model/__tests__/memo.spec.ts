import { mockNoTransferTransaction, mockSingleTransferTransaction } from '@features/receipt/__fixtures__/transactions';
import { describe, expect, it } from 'vitest';

import { extractMemoFromTransaction } from '../memo';

describe('extractMemoFromTransaction', () => {
    it('should extract memo from transaction with memo instruction', () => {
        const memo = extractMemoFromTransaction(mockNoTransferTransaction);
        expect(memo).toBe('Payment for invoice #123');
    });

    it('should return undefined if there is no memo instruction', () => {
        const memo = extractMemoFromTransaction(mockSingleTransferTransaction);
        expect(memo).toBeUndefined();
    });
});
