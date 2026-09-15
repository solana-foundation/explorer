import { describe, expect, it } from 'vitest';

import { formatTransactionVersion } from '../format-transaction-version';

describe('formatTransactionVersion', () => {
    it('should render a legacy transaction as the bare word', () => {
        expect(formatTransactionVersion('legacy')).toBe('legacy');
    });

    it('should render a numbered version with a v prefix', () => {
        expect(formatTransactionVersion(0)).toBe('v0');
    });

    it('should render v1, which the legacy web3.js version union cannot describe', () => {
        expect(formatTransactionVersion(1)).toBe('v1');
    });
});
