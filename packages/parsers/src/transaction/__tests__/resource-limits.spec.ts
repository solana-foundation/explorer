import {
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { MAX_COMPUTE_UNITS } from '../../programs/compute-budget/index.js';
import { V1_DEFAULT_HEAP_SIZE_BYTES, V1_DEFAULT_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BYTES } from '../constants.js';
import { fromCompiledMessage } from '../parse.js';
import { getV1ResourceLimits } from '../resource-limits.js';
import { legacyTransaction, v0Transaction, v1CompiledWithConfig, v1TransactionWithConfig } from './fixtures.js';

describe('getV1ResourceLimits', () => {
    it('should return the declared limits when the message declares all of them', () => {
        const transaction = fromCompiledMessage(
            v1CompiledWithConfig({
                configMask:
                    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK |
                    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK |
                    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK |
                    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
                configValues: [
                    { kind: 'u64', value: 24n },
                    { kind: 'u32', value: 19 },
                    { kind: 'u32', value: 32_000 },
                    { kind: 'u32', value: 64 * 1024 },
                ],
            }),
        );

        expect(getV1ResourceLimits(transaction)).toEqual({
            computeUnitLimit: 19,
            heapSizeBytes: 64 * 1024,
            loadedAccountsDataSizeLimitBytes: 32_000,
            priorityFeeLamports: 24n,
        });
    });

    it('should return the runtime defaults when the message declares no limits', () => {
        expect(getV1ResourceLimits(v1TransactionWithConfig(undefined))).toEqual({
            computeUnitLimit: 0,
            heapSizeBytes: V1_DEFAULT_HEAP_SIZE_BYTES,
            loadedAccountsDataSizeLimitBytes: V1_DEFAULT_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BYTES,
            priorityFeeLamports: 0n,
        });
    });

    it('should keep a declared limit when it is zero', () => {
        const transaction = fromCompiledMessage(
            v1CompiledWithConfig({
                configMask: TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
                configValues: [{ kind: 'u32', value: 0 }],
            }),
        );

        expect(getV1ResourceLimits(transaction)?.heapSizeBytes).toBe(0);
    });

    it('should cap a declared compute unit limit at the runtime maximum', () => {
        const transaction = v1TransactionWithConfig({ computeUnitLimit: MAX_COMPUTE_UNITS + 1 });

        expect(getV1ResourceLimits(transaction)?.computeUnitLimit).toBe(MAX_COMPUTE_UNITS);
    });

    it('should return undefined for legacy and v0 transactions', () => {
        expect(getV1ResourceLimits(legacyTransaction())).toBeUndefined();
        expect(getV1ResourceLimits(v0Transaction())).toBeUndefined();
    });
});
