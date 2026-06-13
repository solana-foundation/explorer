import { describe, expect, test } from 'vitest';

import { getTransactionAccountKeysSizeBytes } from '../AccountsCard';

describe('getTransactionAccountKeysSizeBytes', () => {
    test('should count transaction account keys as 32 bytes each', () => {
        expect(
            getTransactionAccountKeysSizeBytes([
                { source: 'transaction' },
                { source: 'transaction' },
                { source: 'transaction' },
            ]),
        ).toBe(96);
    });

    test('should exclude account keys loaded from address lookup tables', () => {
        expect(
            getTransactionAccountKeysSizeBytes([
                { source: 'transaction' },
                { source: 'lookupTable' },
                { source: 'transaction' },
                { source: 'lookupTable' },
            ]),
        ).toBe(64);
    });
});
