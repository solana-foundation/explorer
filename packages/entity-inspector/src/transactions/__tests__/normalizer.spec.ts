import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import type { SignatureStatusEnvelope } from '../../rpc/types.js';
import type { ResolvedAccount, TransactionPayloadContext } from '../types.js';
import { normalizeTransactionProbe } from '../normalizer.js';

const logger: InspectorLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
};

type Role = { address: string; signer: boolean; writable: boolean };

function staticAccount(role: Role): ResolvedAccount {
    return { ...role, source: 'static' };
}

function lookupTableAccount(role: Role, lookupTableAddress?: string): ResolvedAccount {
    return { ...role, source: 'lookupTable', ...(lookupTableAddress != null && { lookupTableAddress }) };
}

function makeFullEnvelope(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        blockTime: 456,
        meta: {
            computeUnitsConsumed: 12345,
            err: null,
            fee: 5000,
            innerInstructions: [{ index: 0, instructions: [{ accounts: [0], data: 'abc', programIdIndex: 2 }] }],
            logMessages: ['Program 111 invoke [1]', 'Program 111 success'],
        },
        slot: 123,
        transaction: {
            message: {
                accountKeys: ['signer-1', { pubkey: 'signer-2' }, 'program-1', 'readonly-1'],
                header: {
                    numReadonlySignedAccounts: 1,
                    numReadonlyUnsignedAccounts: 1,
                    numRequiredSignatures: 2,
                },
                instructions: [{ accounts: [0, 1], data: '3Bxs', programIdIndex: 2 }],
                recentBlockhash: 'GHtXQBbU2vKfGsFqgEz',
            },
        },
        version: 0,
        ...overrides,
    };
}

function makeStatusEnvelope(overrides: Record<string, unknown> = {}): SignatureStatusEnvelope {
    return {
        value: {
            confirmationStatus: 'finalized',
            confirmations: null,
            ...overrides,
        },
    } as never;
}

function singleSignerMessage(instructions: unknown) {
    return {
        transaction: {
            message: {
                accountKeys: ['signer-1'],
                header: {
                    numReadonlySignedAccounts: 0,
                    numReadonlyUnsignedAccounts: 0,
                    numRequiredSignatures: 1,
                },
                instructions,
                recentBlockhash: 'GHtX',
            },
        },
    };
}

function normalize(
    envelope: Record<string, unknown> | null,
    signatureStatus?: SignatureStatusEnvelope | null,
): TransactionPayloadContext | null {
    return normalizeTransactionProbe('sig', envelope as never, signatureStatus, logger);
}

function mustNormalize(
    envelope: Record<string, unknown>,
    signatureStatus?: SignatureStatusEnvelope | null,
): TransactionPayloadContext {
    const normalized = normalize(envelope, signatureStatus);
    if (normalized === null) {
        throw new Error('expected a normalized transaction context');
    }
    return normalized;
}

describe('transaction normalizer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should normalize mixed account key shapes and successful status', () => {
        expect(mustNormalize(makeFullEnvelope())).toMatchObject({
            accountKeys: ['signer-1', 'signer-2', 'program-1', 'readonly-1'],
            blockTime: 456,
            feeLamports: 5000,
            numRequiredSignatures: 2,
            signature: 'sig',
            slot: 123,
            status: 'success',
        });
    });

    it('should map null metadata to unknown status and null fee', () => {
        expect(mustNormalize(makeFullEnvelope({ blockTime: null, meta: null, slot: 999 }))).toMatchObject({
            computeUnitsConsumed: null,
            err: null,
            feeLamports: null,
            innerInstructions: null,
            logMessages: null,
            status: 'unknown',
        });
    });

    it('should treat undefined meta err as success', () => {
        expect(mustNormalize(makeFullEnvelope({ meta: { err: undefined, fee: 5000 } }))).toMatchObject({
            err: null,
            status: 'success',
        });
    });

    it('should return null for a null envelope', () => {
        expect(normalize(null)).toBeNull();
    });

    it('should throw on an account key that is neither a string nor {pubkey: string}', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: null,
                    transaction: {
                        message: {
                            // oxlint-disable-next-line no-explicit-any -- malformed probe shape on purpose
                            accountKeys: [{ pubkey: 42 } as any],
                            header: {
                                numReadonlySignedAccounts: 0,
                                numReadonlyUnsignedAccounts: 0,
                                numRequiredSignatures: 1,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('Unexpected transaction probe: accountKey is not a string or {pubkey: string}: {"pubkey":42}');
    });

    it('should throw on negative required signature count', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: null,
                    transaction: {
                        message: {
                            accountKeys: ['signer-1'],
                            header: {
                                numReadonlySignedAccounts: 0,
                                numReadonlyUnsignedAccounts: 0,
                                numRequiredSignatures: -1,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('numRequiredSignatures (-1) out of range for 1 account keys');
    });

    it('should handle bigint slot and fee values', () => {
        expect(
            mustNormalize(
                makeFullEnvelope({
                    blockTime: BigInt(1000),
                    meta: { computeUnitsConsumed: BigInt(99), err: null, fee: BigInt(5000) },
                    slot: BigInt(42),
                }),
            ),
        ).toMatchObject({
            blockTime: 1000,
            computeUnitsConsumed: 99,
            feeLamports: 5000,
            slot: 42,
        });
    });

    it('should extract the version field', () => {
        expect(mustNormalize(makeFullEnvelope({ version: 0 }))).toMatchObject({ version: 0 });
        expect(mustNormalize(makeFullEnvelope({ version: 'legacy' }))).toMatchObject({ version: 'legacy' });
        expect(mustNormalize(makeFullEnvelope({ version: undefined }))).toMatchObject({ version: null });
    });

    it('should narrow a bigint version to its numeric value', () => {
        expect(mustNormalize(makeFullEnvelope({ version: BigInt(0) }))).toMatchObject({ version: 0 });
    });

    it('should throw on unsupported numeric versions', () => {
        expect(() => normalize(makeFullEnvelope({ version: 1 }))).toThrow('unsupported transaction version (1)');
        expect(() => normalize(makeFullEnvelope({ version: BigInt(2) }))).toThrow(
            'unsupported transaction version (2)',
        );
    });

    it('should normalize computeUnitsConsumed from bigint', () => {
        expect(
            mustNormalize(makeFullEnvelope({ meta: { computeUnitsConsumed: BigInt(12345), err: null, fee: 5000 } })),
        ).toMatchObject({ computeUnitsConsumed: 12345 });
    });

    it('should pass through object err for failed transactions', () => {
        const errDetail = { InstructionError: [0, 'Custom'] };
        expect(mustNormalize(makeFullEnvelope({ meta: { err: errDetail, fee: 5000 } }))).toMatchObject({
            err: errDetail,
            status: 'failed',
        });
    });

    it('should pass through string err for simple error variants', () => {
        for (const variant of ['AccountInUse', 'BlockhashNotFound', 'InsufficientFundsForRent']) {
            expect(mustNormalize(makeFullEnvelope({ meta: { err: variant, fee: 5000 } }))).toMatchObject({
                err: variant,
                status: 'failed',
            });
        }
    });

    it('should pass through array-shaped err for failed transactions', () => {
        const arrErr = ['InstructionError', [0, 'Custom']];
        expect(mustNormalize(makeFullEnvelope({ meta: { err: arrErr, fee: 5000 } }))).toMatchObject({
            err: arrErr,
            status: 'failed',
        });
    });

    it('should stringify an unrecognized error shape and warn', () => {
        expect(mustNormalize(makeFullEnvelope({ meta: { err: 42, fee: 5000 } }))).toMatchObject({
            err: '42',
            status: 'failed',
        });
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] transaction normalizer: unrecognized err shape', {
            signature: 'sig',
            value: '42',
        });
    });

    it('should pass through the logMessages array and default it to null', () => {
        const logs = ['Program 111 invoke [1]', 'Program 111 success'];
        expect(
            mustNormalize(makeFullEnvelope({ meta: { err: null, fee: 5000, logMessages: logs } })).logMessages,
        ).toEqual(logs);
        expect(mustNormalize(makeFullEnvelope({ meta: { err: null, fee: 5000 } })).logMessages).toBeNull();
    });

    it('should extract recentBlockhash and default it to null', () => {
        expect(mustNormalize(makeFullEnvelope()).recentBlockhash).toBe('GHtXQBbU2vKfGsFqgEz');

        const withoutHash = mustNormalize(
            makeFullEnvelope({
                transaction: {
                    message: {
                        accountKeys: ['signer-1', 'signer-2', 'program-1', 'readonly-1'],
                        header: {
                            numReadonlySignedAccounts: 1,
                            numReadonlyUnsignedAccounts: 1,
                            numRequiredSignatures: 2,
                        },
                        instructions: [{ accounts: [0, 1], data: '3Bxs', programIdIndex: 2 }],
                    },
                },
            }),
        );
        expect(withoutHash.recentBlockhash).toBeNull();
    });

    it('should throw when slot exceeds the safe integer range', () => {
        expect(() => normalize(makeFullEnvelope({ slot: BigInt('9007199254740992') }))).toThrow(
            'Unexpected transaction probe: slot is not a safe number.',
        );
    });

    it('should preserve unsafe bigint values as strings', () => {
        const unsafeBigint = BigInt('9007199254740992');
        const normalized = mustNormalize(
            makeFullEnvelope({ meta: { computeUnitsConsumed: unsafeBigint, err: null, fee: unsafeBigint } }),
        );

        expect(normalized.feeLamports).toBe('9007199254740992');
        expect(normalized.computeUnitsConsumed).toBe('9007199254740992');
    });

    it('should stringify unsafe finite number values', () => {
        const unsafeNumber = Number.MAX_SAFE_INTEGER + 1;
        expect(mustNormalize(makeFullEnvelope({ meta: { err: null, fee: unsafeNumber } })).feeLamports).toBe(
            String(unsafeNumber),
        );
    });

    it('should throw when all signers would be readonly', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    transaction: {
                        message: {
                            accountKeys: ['a', 'b', 'c'],
                            header: {
                                numReadonlySignedAccounts: 2,
                                numReadonlyUnsignedAccounts: 0,
                                numRequiredSignatures: 2,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('readonly counts (signed=2, unsigned=0) exceed available accounts');
    });

    it('should throw when the signer count exceeds the account keys length', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    transaction: {
                        message: {
                            accountKeys: ['a', 'b'],
                            header: {
                                numReadonlySignedAccounts: 0,
                                numReadonlyUnsignedAccounts: 0,
                                numRequiredSignatures: 5,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('numRequiredSignatures (5) out of range for 2 account keys');
    });

    it('should throw when the readonly unsigned count exceeds non-signer accounts', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    transaction: {
                        message: {
                            accountKeys: ['a', 'b', 'c'],
                            header: {
                                numReadonlySignedAccounts: 0,
                                numReadonlyUnsignedAccounts: 5,
                                numRequiredSignatures: 1,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('readonly counts (signed=0, unsigned=5) exceed available accounts');
    });

    it('should reject negative readonly header counts', () => {
        for (const header of [
            { numReadonlySignedAccounts: -1, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 1 },
            { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: -1, numRequiredSignatures: 1 },
        ]) {
            expect(() =>
                normalize(
                    makeFullEnvelope({
                        transaction: { message: { accountKeys: ['signer-1'], header, instructions: [] } },
                    }),
                ),
            ).toThrow('Unexpected transaction probe:');
        }
    });

    it('should reject zero required signatures', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: null,
                    transaction: {
                        message: {
                            accountKeys: ['a'],
                            header: {
                                numReadonlySignedAccounts: 0,
                                numReadonlyUnsignedAccounts: 0,
                                numRequiredSignatures: 0,
                            },
                            instructions: [],
                        },
                    },
                }),
            ),
        ).toThrow('numRequiredSignatures (0) out of range');
    });

    it('should default missing instructions to an empty list', () => {
        const normalized = mustNormalize(
            makeFullEnvelope({
                meta: { err: null, fee: 5000 },
                transaction: {
                    message: {
                        accountKeys: ['signer-1'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: undefined,
                    },
                },
            }),
        );

        expect(normalized.instructions).toEqual([]);
    });

    it('should pass through instructions and innerInstructions', () => {
        const normalized = mustNormalize(makeFullEnvelope());

        expect(normalized.instructions).toEqual([{ accounts: [0, 1], data: '3Bxs', programIdIndex: 2 }]);
        expect(normalized.innerInstructions).toEqual([
            { index: 0, instructions: [{ accounts: [0], data: 'abc', programIdIndex: 2 }] },
        ]);
    });

    it('should map finalized status to max confirmations', () => {
        expect(mustNormalize(makeFullEnvelope(), makeStatusEnvelope())).toMatchObject({
            confirmationStatus: 'finalized',
            confirmations: 'max',
        });
    });

    it('should pass through numeric confirmations for non-finalized statuses', () => {
        expect(
            mustNormalize(
                makeFullEnvelope(),
                makeStatusEnvelope({ confirmationStatus: 'confirmed', confirmations: 42 }),
            ),
        ).toMatchObject({ confirmationStatus: 'confirmed', confirmations: 42 });
        expect(
            mustNormalize(
                makeFullEnvelope(),
                makeStatusEnvelope({ confirmationStatus: 'processed', confirmations: 3 }),
            ),
        ).toMatchObject({ confirmationStatus: 'processed', confirmations: 3 });
    });

    it('should convert bigint confirmations to a number', () => {
        expect(
            mustNormalize(
                makeFullEnvelope(),
                makeStatusEnvelope({ confirmationStatus: 'confirmed', confirmations: BigInt(10) }),
            ),
        ).toMatchObject({ confirmationStatus: 'confirmed', confirmations: 10 });
    });

    it('should default confirmation fields to null when the status envelope is null or omitted', () => {
        expect(mustNormalize(makeFullEnvelope(), null)).toMatchObject({
            confirmationStatus: null,
            confirmations: null,
        });
        expect(mustNormalize(makeFullEnvelope())).toMatchObject({ confirmationStatus: null, confirmations: null });
        expect(mustNormalize(makeFullEnvelope(), { value: null })).toMatchObject({
            confirmationStatus: null,
            confirmations: null,
        });
    });

    it('should default confirmations to null for non-finalized with a null count', () => {
        expect(
            mustNormalize(
                makeFullEnvelope(),
                makeStatusEnvelope({ confirmationStatus: 'confirmed', confirmations: null }),
            ),
        ).toMatchObject({ confirmationStatus: 'confirmed', confirmations: null });
    });

    it('should map an unrecognized confirmation status to null while preserving confirmations and warn', () => {
        expect(
            mustNormalize(
                makeFullEnvelope(),
                makeStatusEnvelope({ confirmationStatus: 'optimistic', confirmations: 5 }),
            ),
        ).toMatchObject({ confirmationStatus: null, confirmations: 5 });
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] transaction normalizer: unknown confirmation status',
            { signature: 'sig', value: 'optimistic' },
        );
    });

    it('should throw on out-of-bounds instruction indices', () => {
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: { err: null, fee: 5000 },
                    ...singleSignerMessage([{ accounts: [0], data: 'abc', programIdIndex: 5 }]),
                }),
            ),
        ).toThrow('Unexpected transaction probe:');
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: { err: null, fee: 5000 },
                    ...singleSignerMessage([{ accounts: [0, 99], data: 'abc', programIdIndex: 0 }]),
                }),
            ),
        ).toThrow('Unexpected transaction probe:');
        expect(() =>
            normalize(
                makeFullEnvelope({
                    meta: { err: null, fee: 5000 },
                    ...singleSignerMessage([{ accounts: [0], data: 'abc', programIdIndex: -1 }]),
                }),
            ),
        ).toThrow('instruction index out of bounds (programIdIndex=-1');
    });

    it('should throw on out-of-bounds inner instruction indices', () => {
        const envelope = (innerInstructions: unknown) =>
            makeFullEnvelope({
                meta: { err: null, fee: 5000, innerInstructions },
                transaction: {
                    message: {
                        accountKeys: ['signer-1'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: 'abc', programIdIndex: 0 }],
                        recentBlockhash: 'GHtX',
                    },
                },
            });

        expect(() =>
            normalize(envelope([{ index: 0, instructions: [{ accounts: [0], data: 'abc', programIdIndex: 99 }] }])),
        ).toThrow('Unexpected transaction probe:');
        expect(() =>
            normalize(envelope([{ index: 0, instructions: [{ accounts: [-1], data: 'abc', programIdIndex: 0 }] }])),
        ).toThrow('inner instruction index out of bounds (programIdIndex=0, accounts=[-1]');
    });

    it('should throw when an inner instruction group index is out of bounds', () => {
        const envelope = (index: number) =>
            makeFullEnvelope({
                meta: {
                    err: null,
                    fee: 5000,
                    innerInstructions: [{ index, instructions: [{ accounts: [0], data: 'abc', programIdIndex: 0 }] }],
                },
                transaction: {
                    message: {
                        accountKeys: ['signer-1'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: 'abc', programIdIndex: 0 }],
                        recentBlockhash: 'GHtX',
                    },
                },
            });

        expect(() => normalize(envelope(5))).toThrow(
            'inner instruction group index (5) out of bounds for 1 instructions',
        );
        expect(() => normalize(envelope(1))).toThrow(
            'inner instruction group index (1) out of bounds for 1 instructions',
        );
        expect(() => normalize(envelope(-1))).toThrow('inner instruction group index (-1) out of bounds');
    });

    it('should normalize non-finite numeric values to null', () => {
        expect(mustNormalize(makeFullEnvelope({ blockTime: NaN })).blockTime).toBeNull();
        expect(mustNormalize(makeFullEnvelope({ blockTime: Infinity })).blockTime).toBeNull();
        expect(mustNormalize(makeFullEnvelope({ meta: { err: null, fee: -Infinity } })).feeLamports).toBeNull();
    });

    it('should include resolvedAccounts with source in the normalized output', () => {
        expect(mustNormalize(makeFullEnvelope()).resolvedAccounts).toEqual([
            staticAccount({ address: 'signer-1', signer: true, writable: true }),
            staticAccount({ address: 'signer-2', signer: true, writable: false }),
            staticAccount({ address: 'program-1', signer: false, writable: true }),
            staticAccount({ address: 'readonly-1', signer: false, writable: false }),
        ]);
    });

    it('should merge loadedAddresses for v0 transactions', () => {
        const normalized = mustNormalize(
            makeFullEnvelope({
                meta: { err: null, fee: 5000, loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1'] } },
                transaction: {
                    message: {
                        accountKeys: ['signer', 'program'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 1,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: '3Bxs', programIdIndex: 1 }],
                    },
                },
                version: 0,
            }),
        );

        expect(normalized.accountKeys).toEqual(['signer', 'program', 'alt-w1', 'alt-r1']);
        expect(normalized.resolvedAccounts).toEqual([
            staticAccount({ address: 'signer', signer: true, writable: true }),
            staticAccount({ address: 'program', signer: false, writable: false }),
            lookupTableAccount({ address: 'alt-w1', signer: false, writable: true }),
            lookupTableAccount({ address: 'alt-r1', signer: false, writable: false }),
        ]);
    });

    it('should tag loaded accounts with their lookup table address', () => {
        const normalized = mustNormalize(
            makeFullEnvelope({
                meta: {
                    err: null,
                    fee: 5000,
                    loadedAddresses: { readonly: ['alt-r1'], writable: ['alt-w1', 'alt-w2'] },
                },
                transaction: {
                    message: {
                        accountKeys: ['signer'],
                        addressTableLookups: [
                            { accountKey: 'ALT-A', readonlyIndexes: [1], writableIndexes: [0] },
                            { accountKey: 'ALT-B', readonlyIndexes: [], writableIndexes: [2] },
                        ],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: '3Bxs', programIdIndex: 0 }],
                    },
                },
                version: 0,
            }),
        );

        expect(normalized.resolvedAccounts[1]).toEqual(
            lookupTableAccount({ address: 'alt-w1', signer: false, writable: true }, 'ALT-A'),
        );
        expect(normalized.resolvedAccounts[2]).toEqual(
            lookupTableAccount({ address: 'alt-w2', signer: false, writable: true }, 'ALT-B'),
        );
        expect(normalized.resolvedAccounts[3]).toEqual(
            lookupTableAccount({ address: 'alt-r1', signer: false, writable: false }, 'ALT-A'),
        );
    });

    it('should warn when the lookup indexes do not cover the loaded addresses', () => {
        mustNormalize(
            makeFullEnvelope({
                meta: {
                    err: null,
                    fee: 5000,
                    loadedAddresses: { readonly: [], writable: ['alt-w1', 'alt-w2'] },
                },
                transaction: {
                    message: {
                        accountKeys: ['signer'],
                        addressTableLookups: [{ accountKey: 'ALT-A', readonlyIndexes: [], writableIndexes: [0] }],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: '3Bxs', programIdIndex: 0 }],
                    },
                },
                version: 0,
            }),
        );

        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] address table lookup counts do not cover the loaded addresses',
            { signature: 'sig' },
        );
    });

    it('should validate v0 instruction indices against the merged key range', () => {
        const envelope = (instructions: unknown, loadedAddresses: unknown) =>
            makeFullEnvelope({
                meta: { err: null, fee: 5000, loadedAddresses },
                transaction: {
                    message: {
                        accountKeys: ['signer'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions,
                    },
                },
                version: 0,
            });

        expect(
            mustNormalize(
                envelope([{ accounts: [0, 2], data: '3Bxs', programIdIndex: 1 }], {
                    readonly: ['alt-r1'],
                    writable: ['alt-w1'],
                }),
            ).accountKeys,
        ).toHaveLength(3);
        expect(() =>
            normalize(
                envelope([{ accounts: [0], data: '3Bxs', programIdIndex: 5 }], { readonly: [], writable: ['alt-w1'] }),
            ),
        ).toThrow('instruction index out of bounds');
    });

    it('should behave like legacy for v0 with null loadedAddresses', () => {
        const normalized = mustNormalize(
            makeFullEnvelope({
                meta: { err: null, fee: 5000, loadedAddresses: null },
                transaction: {
                    message: {
                        accountKeys: ['signer'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 1,
                        },
                        instructions: [{ accounts: [0], data: '3Bxs', programIdIndex: 0 }],
                    },
                },
                version: 0,
            }),
        );

        expect(normalized.accountKeys).toEqual(['signer']);
    });

    it('should validate the header against the static key count, not the merged total', () => {
        const normalized = mustNormalize(
            makeFullEnvelope({
                meta: {
                    err: null,
                    fee: 5000,
                    loadedAddresses: { readonly: [], writable: ['alt-w1', 'alt-w2', 'alt-w3'] },
                },
                transaction: {
                    message: {
                        accountKeys: ['signer-1', 'signer-2'],
                        header: {
                            numReadonlySignedAccounts: 0,
                            numReadonlyUnsignedAccounts: 0,
                            numRequiredSignatures: 2,
                        },
                        instructions: [{ accounts: [1], data: '3Bxs', programIdIndex: 0 }],
                    },
                },
                version: 0,
            }),
        );

        expect(normalized.accountKeys).toHaveLength(5);
        expect(normalized.resolvedAccounts).toHaveLength(5);
    });
});
