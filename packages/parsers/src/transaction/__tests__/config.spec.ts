import {
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { fromRpcTransactionConfig, getTransactionConfig, readTransactionConfig } from '../config.js';
import { InvalidTransactionConfigError } from '../errors.js';
import { fromRpcTransaction } from '../parse.js';
import type { ParsedTransaction, RpcTransactionConfig } from '../types.js';
import {
    jsonParsedResponse,
    jsonResponse,
    legacyTransaction,
    v0Transaction,
    v1CompiledWithConfig,
} from './fixtures.js';

const BASE = {
    accounts: [],
    instructions: [],
    numSignerAccounts: 1,
    lifetimeSpecifier: gen.blockhash(7),
    signatures: [],
};

describe('readTransactionConfig', () => {
    it('should read every declared limit in wire order', () => {
        const message = v1CompiledWithConfig({
            configMask:
                TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK |
                TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK |
                TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK |
                TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
            configValues: [
                { kind: 'u64', value: 24n },
                { kind: 'u32', value: 19 },
                { kind: 'u32', value: 32_000 },
                { kind: 'u32', value: 256 },
            ],
        });

        expect(readTransactionConfig(message)).toEqual({
            computeUnitLimit: 19,
            heapSize: 256,
            loadedAccountsDataSizeLimit: 32_000,
            priorityFeeLamports: 24n,
        });
    });

    it('should read only the declared limit when the mask declares one', () => {
        const message = v1CompiledWithConfig({
            configMask: TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
            configValues: [{ kind: 'u32', value: 19 }],
        });

        expect(readTransactionConfig(message)).toEqual({ computeUnitLimit: 19 });
    });

    it('should return undefined when the message declares no limits', () => {
        const message = v1CompiledWithConfig({ configMask: 0, configValues: [] });

        expect(readTransactionConfig(message)).toBeUndefined();
    });

    it.each([
        ['legacy', legacyTransaction],
        ['v0', v0Transaction],
    ] as const)('should return undefined when the message is %s', (_label, fixture) => {
        expect(readTransactionConfig(fixture.compiled())).toBeUndefined();
    });

    it('should throw when only one priority fee mask bit is set', () => {
        const message = v1CompiledWithConfig({ configMask: 0b01, configValues: [{ kind: 'u64', value: 1n }] });

        expect(() => readTransactionConfig(message)).toThrow(InvalidTransactionConfigError);
        expect(() => readTransactionConfig(message)).toThrow('Invalid transaction config mask: 1.');
    });

    it('should throw when a value has the wrong kind for its field', () => {
        const message = v1CompiledWithConfig({
            configMask: TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
            configValues: [{ kind: 'u64', value: 19n }],
        });

        expect(() => readTransactionConfig(message)).toThrow(InvalidTransactionConfigError);
        expect(() => readTransactionConfig(message)).toThrow('Config value for computeUnitLimit is u64, expected u32.');
    });

    it('should throw when the mask declares more values than arrived', () => {
        const message = v1CompiledWithConfig({
            configMask: TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
            configValues: [],
        });

        expect(() => readTransactionConfig(message)).toThrow(InvalidTransactionConfigError);
        expect(() => readTransactionConfig(message)).toThrow(
            'Config value for computeUnitLimit is missing, expected u32.',
        );
    });
});

// eslint-disable-next-line unicorn/no-null -- the RPC marks an absent limit null
const ABSENT = null;

function rpcConfig(overrides: Partial<RpcTransactionConfig> = {}): RpcTransactionConfig {
    return {
        computeUnitLimit: ABSENT,
        heapSize: ABSENT,
        loadedAccountsDataSizeLimit: ABSENT,
        priorityFee: ABSENT,
        ...overrides,
    };
}

describe('fromRpcTransactionConfig', () => {
    it('should omit a limit when the RPC sends it as null', () => {
        const config = fromRpcTransactionConfig(rpcConfig({ computeUnitLimit: 19, priorityFee: 24n }));

        expect(config).toEqual({ computeUnitLimit: 19, priorityFeeLamports: 24n });
    });

    it('should return undefined when every limit is null', () => {
        expect(fromRpcTransactionConfig(rpcConfig())).toBeUndefined();
    });

    it('should return undefined when the response has no config', () => {
        expect(fromRpcTransactionConfig(undefined)).toBeUndefined();
    });
});

describe('getTransactionConfig', () => {
    it('should return the config of a v1 transaction', () => {
        const transaction: ParsedTransaction = { ...BASE, config: { computeUnitLimit: 19 }, version: 1 };

        expect(getTransactionConfig(transaction)).toEqual({ computeUnitLimit: 19 });
    });

    it('should return undefined for a v0 transaction', () => {
        const transaction: ParsedTransaction = { ...BASE, addressTableLookups: [], version: 0 };

        expect(getTransactionConfig(transaction)).toBeUndefined();
    });

    it.each([
        ['json', jsonResponse],
        ['jsonParsed', jsonParsedResponse],
    ] as const)('should return the config of a v1 %s response', (_label, makeResponse) => {
        const response = makeResponse(1);
        response.transaction.message.transactionConfig = rpcConfig({ computeUnitLimit: 19, priorityFee: 7n });

        expect(getTransactionConfig(fromRpcTransaction(response))).toEqual({
            computeUnitLimit: 19,
            priorityFeeLamports: 7n,
        });
    });
});
