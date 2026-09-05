import { createIdlClient } from '@explorer/idl-decode';
import { address, getBase58Decoder, isSignerRole, isWritableRole } from '@solana/kit';
import { getBatchInstruction, getTransferInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import type { ResolvedAccount, TransactionPayloadContext } from '../types.js';
import { decodeTransactionInstructions } from '../decode-instructions.js';

const logger: InspectorLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
};

const SOURCE = 'So11111111111111111111111111111111111111112';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DESTINATION = 'HrTf9CzXR1dRH4Sof5QrpmGWwpwAf3qZzwCsEjQpXcSq';
const AUTHORITY = '4ZtXhPXLy1wuLkF8muzPkmNqZ1wganC3VryfzK1aHtqa';
const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';

// transferChecked's node shape, minus the docs — a real root so the engine's own account naming and
// the decimals-bearing arguments are exercised, without depending on another package's fixtures.
const TRANSFER_CHECKED_IDL = {
    additionalPrograms: [],
    kind: 'rootNode',
    program: {
        accounts: [],
        definedTypes: [],
        errors: [],
        instructions: [
            {
                accounts: [
                    { isSigner: false, isWritable: true, kind: 'instructionAccountNode', name: 'source' },
                    { isSigner: false, isWritable: false, kind: 'instructionAccountNode', name: 'mint' },
                    { isSigner: false, isWritable: true, kind: 'instructionAccountNode', name: 'destination' },
                    { isSigner: 'either', isWritable: false, kind: 'instructionAccountNode', name: 'authority' },
                ],
                arguments: [
                    {
                        defaultValue: { kind: 'numberValueNode', number: 12 },
                        defaultValueStrategy: 'omitted',
                        kind: 'instructionArgumentNode',
                        name: 'discriminator',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: 'amount',
                        type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: 'decimals',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                ],
                discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'discriminator', offset: 0 }],
                kind: 'instructionNode',
                name: 'transferChecked',
            },
        ],
        kind: 'programNode',
        name: 'token',
        pdas: [],
        publicKey: TOKEN_PROGRAM_ADDRESS,
        version: '1.0.0',
    },
    standard: 'codama',
    version: '1.0.0',
} as const;

// discriminator 12 · amount 100_000 (u64 le) · decimals 6
const TRANSFER_CHECKED_DATA = getBase58Decoder().decode(new Uint8Array([12, 0xa0, 0x86, 0x01, 0, 0, 0, 0, 0, 6]));

// Tokenkeg's published batch node, trimmed to the discriminator and a remainder-bytes payload: enough to
// claim a 0xff instruction and flatten its sub-instructions away, which is what the rung order prevents.
const BATCH_IDL = {
    additionalPrograms: [],
    kind: 'rootNode',
    program: {
        accounts: [],
        definedTypes: [],
        errors: [],
        instructions: [
            {
                accounts: [],
                arguments: [
                    {
                        defaultValue: { kind: 'numberValueNode', number: 255 },
                        defaultValueStrategy: 'omitted',
                        kind: 'instructionArgumentNode',
                        name: 'discriminator',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                    { kind: 'instructionArgumentNode', name: 'data', type: { kind: 'bytesTypeNode' } },
                ],
                discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'discriminator', offset: 0 }],
                kind: 'instructionNode',
                name: 'batch',
            },
        ],
        kind: 'programNode',
        name: 'token',
        pdas: [],
        publicKey: TOKEN_PROGRAM_ADDRESS,
        version: '1.0.0',
    },
    standard: 'codama',
    version: '1.0.0',
} as const;

// setComputeUnitLimit's node shape — a real instruction that declares no accounts at all.
const SET_COMPUTE_UNIT_LIMIT_IDL = {
    additionalPrograms: [],
    kind: 'rootNode',
    program: {
        accounts: [],
        definedTypes: [],
        errors: [],
        instructions: [
            {
                accounts: [],
                arguments: [
                    {
                        defaultValue: { kind: 'numberValueNode', number: 2 },
                        defaultValueStrategy: 'omitted',
                        kind: 'instructionArgumentNode',
                        name: 'discriminator',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: 'units',
                        type: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
                    },
                ],
                discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'discriminator', offset: 0 }],
                kind: 'instructionNode',
                name: 'setComputeUnitLimit',
            },
        ],
        kind: 'programNode',
        name: 'computeBudget',
        pdas: [],
        publicKey: COMPUTE_BUDGET_PROGRAM,
        version: '1.0.0',
    },
    standard: 'codama',
    version: '1.0.0',
} as const;

// discriminator 2 · units 200_000 (u32 le)
const SET_COMPUTE_UNIT_LIMIT_DATA = getBase58Decoder().decode(new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00]));

function staticAccount(accountAddress: string, roles: { signer?: boolean; writable?: boolean } = {}): ResolvedAccount {
    return {
        address: accountAddress,
        signer: roles.signer ?? false,
        source: 'static',
        writable: roles.writable ?? false,
    };
}

function makeContext(overrides: Partial<TransactionPayloadContext> = {}): TransactionPayloadContext {
    const accounts = [
        staticAccount('fee-payer', { signer: true, writable: true }),
        staticAccount('writable-nonsigner', { writable: true }),
        staticAccount('program'),
    ];
    return {
        accountKeys: accounts.map(account => account.address),
        blockTime: 456,
        computeUnitsConsumed: 99,
        confirmationStatus: null,
        confirmations: null,
        err: null,
        feeLamports: 5000,
        innerInstructions: null,
        instructions: [{ accounts: [0, 1], data: 'abc', programIdIndex: 2 }],
        logMessages: null,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
        numRequiredSignatures: 1,
        recentBlockhash: null,
        resolvedAccounts: accounts,
        signature: 'sig',
        slot: 123,
        status: 'success',
        version: 'legacy',
        ...overrides,
    } as TransactionPayloadContext;
}

// A single batched Transfer of 7, wired as the transaction's only instruction.
function makeBatchContext() {
    const transfer = getTransferInstruction({
        amount: 7n,
        authority: address('SysvarC1ock11111111111111111111111111111111'),
        destination: address('SysvarRent111111111111111111111111111111111'),
        source: address(SOURCE),
    });
    const batch = getBatchInstruction([transfer]);
    const accounts = [
        ...(batch.accounts ?? []).map(meta => ({
            address: meta.address,
            signer: isSignerRole(meta.role),
            source: 'static' as const,
            writable: isWritableRole(meta.role),
        })),
        staticAccount(TOKEN_PROGRAM_ADDRESS),
    ];
    return {
        context: makeContext({
            accountKeys: accounts.map(account => account.address),
            instructions: [
                {
                    accounts: accounts.slice(0, -1).map((_, index) => index),
                    data: getBase58Decoder().decode(batch.data),
                    programIdIndex: accounts.length - 1,
                },
            ],
            resolvedAccounts: accounts,
        }),
        kitInstruction: { ...batch, data: new Uint8Array(batch.data) },
    };
}

describe('decodeTransactionInstructions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve instruction program_id and accounts to addresses and default to raw', async () => {
        const entries = await decodeTransactionInstructions(makeContext(), { logger });

        expect(entries).toEqual([
            {
                accounts: ['fee-payer', 'writable-nonsigner'],
                data: 'abc',
                inner_instructions: [],
                program_id: 'program',
                source: 'raw',
            },
        ]);
    });

    it('should nest inner instructions under their parent', async () => {
        const entries = await decodeTransactionInstructions(
            makeContext({
                innerInstructions: [{ index: 0, instructions: [{ accounts: [0], data: 'def', programIdIndex: 2 }] }],
            }),
            { logger },
        );

        expect(entries[0].inner_instructions).toEqual([
            { accounts: ['fee-payer'], data: 'def', program_id: 'program', source: 'raw' },
        ]);
    });

    it('should map non-contiguous inner instruction groups to the correct parents', async () => {
        const accounts = [
            staticAccount('signer', { signer: true, writable: true }),
            staticAccount('prog-a'),
            staticAccount('prog-b'),
            staticAccount('prog-c'),
        ];
        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                innerInstructions: [
                    { index: 0, instructions: [{ accounts: [0], data: 'cpi0', programIdIndex: 2 }] },
                    { index: 2, instructions: [{ accounts: [0], data: 'cpi2', programIdIndex: 1 }] },
                ],
                instructions: [
                    { accounts: [0], data: 'ix0', programIdIndex: 1 },
                    { accounts: [0], data: 'ix1', programIdIndex: 2 },
                    { accounts: [0], data: 'ix2', programIdIndex: 3 },
                ],
                numReadonlyUnsignedAccounts: 3,
                resolvedAccounts: accounts,
            }),
            { logger },
        );

        expect(entries[0].inner_instructions).toMatchObject([{ data: 'cpi0', program_id: 'prog-b' }]);
        expect(entries[1].inner_instructions).toEqual([]);
        expect(entries[2].inner_instructions).toMatchObject([{ data: 'cpi2', program_id: 'prog-a' }]);
    });

    it('should concatenate inner instructions when multiple groups share the same parent index', async () => {
        const entries = await decodeTransactionInstructions(
            makeContext({
                innerInstructions: [
                    { index: 0, instructions: [{ accounts: [0], data: 'cpi-a', programIdIndex: 2 }] },
                    { index: 0, instructions: [{ accounts: [0], data: 'cpi-b', programIdIndex: 1 }] },
                ],
            }),
            { logger },
        );

        expect(entries[0].inner_instructions).toMatchObject([
            { data: 'cpi-a', program_id: 'program' },
            { data: 'cpi-b', program_id: 'writable-nonsigner' },
        ]);
    });

    it('should reject when an instruction index is out of bounds', async () => {
        await expect(
            decodeTransactionInstructions(
                makeContext({ instructions: [{ accounts: [0], data: 'abc', programIdIndex: 9 }] }),
                { logger },
            ),
        ).rejects.toThrow('account index 9 out of bounds for 3 keys');
        await expect(
            decodeTransactionInstructions(
                makeContext({ instructions: [{ accounts: [9], data: 'abc', programIdIndex: 2 }] }),
                { logger },
            ),
        ).rejects.toThrow('account index 9 out of bounds for 3 keys');
    });

    it('should route instructions through the injected fallback with roles attached', async () => {
        const decodeInstructionFallback = vi.fn().mockReturnValue({ info: {}, program: 'system', type: 'transfer' });

        const entries = await decodeTransactionInstructions(makeContext(), { decodeInstructionFallback, logger });

        expect(decodeInstructionFallback).toHaveBeenCalledWith({
            accounts: [
                { address: 'fee-payer', signer: true, writable: true },
                { address: 'writable-nonsigner', signer: false, writable: true },
            ],
            data: 'abc',
            programId: 'program',
        });
        expect(entries[0]).toMatchObject({
            decoded: { info: {}, program: 'system', type: 'transfer' },
            source: 'bundled',
        });
    });

    it('should stay raw when the fallback cannot decode', async () => {
        const decodeInstructionFallback = vi.fn().mockReturnValue(undefined);

        const entries = await decodeTransactionInstructions(makeContext(), { decodeInstructionFallback, logger });

        expect(decodeInstructionFallback).toHaveBeenCalled();
        expect(entries[0].source).toBe('raw');
        expect(entries[0]).not.toHaveProperty('decoded');
    });

    it('should tolerate a throwing fallback and warn', async () => {
        const decodeInstructionFallback = vi.fn().mockImplementation(() => {
            throw new Error('fallback exploded');
        });

        const entries = await decodeTransactionInstructions(makeContext(), { decodeInstructionFallback, logger });

        expect(entries[0].source).toBe('raw');
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] fallback instruction decode failed',
            expect.objectContaining({ programId: 'program' }),
        );
    });

    it('should decode token batch instructions in-package before consulting the fallback', async () => {
        const decodeInstructionFallback = vi.fn();

        const entries = await decodeTransactionInstructions(makeBatchContext().context, {
            decodeInstructionFallback,
            logger,
        });

        expect(decodeInstructionFallback).not.toHaveBeenCalled();
        expect(entries[0]).toMatchObject({
            decoded: {
                info: { instructions: [{ data: { amount: 7n, discriminator: 3 }, type: 'Transfer' }] },
                program: 'spl-token',
                type: 'batch',
            },
            source: 'bundled',
        });
    });

    it('should keep the batch sub-instruction expansion when the program publishes a batch-declaring IDL', async () => {
        const { context } = makeBatchContext();
        const resolveIdlClient = vi.fn().mockResolvedValue(createIdlClient(BATCH_IDL));

        const entries = await decodeTransactionInstructions(context, { logger, resolveIdlClient });

        expect(entries[0]).toMatchObject({
            decoded: {
                info: { instructions: [{ data: { amount: 7n, discriminator: 3 }, type: 'Transfer' }] },
                program: 'spl-token',
                type: 'batch',
            },
            source: 'bundled',
        });
    });

    it('should confirm the batch-declaring IDL claims the instruction when consulted directly', () => {
        const { kitInstruction } = makeBatchContext();

        // Guards the rung-order test above from passing vacuously if the fixture stops matching 0xff.
        expect(createIdlClient(BATCH_IDL).decodeInstruction(kitInstruction).kind).toBe('codama');
    });

    it('should decode through a resolved IDL client before the bundled rungs', async () => {
        const PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const accounts = [staticAccount(SOURCE, { signer: true, writable: true }), staticAccount(PROGRAM)];
        const idlClient = {
            decodeInstruction: vi.fn().mockReturnValue({ decoded: { amount: 42n }, kind: 'anchor' }),
            getDecodedData: vi.fn().mockReturnValue({ amount: 42n }),
            instructionName: vi.fn().mockReturnValue('buy'),
            programName: vi.fn().mockReturnValue('pump'),
        } as never;
        const resolveIdlClient = vi.fn().mockResolvedValue(idlClient);
        const decodeInstructionFallback = vi.fn();

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [{ accounts: [0], data: 'abc', programIdIndex: 1 }],
                resolvedAccounts: accounts,
            }),
            { decodeInstructionFallback, logger, resolveIdlClient },
        );

        expect(resolveIdlClient).toHaveBeenCalledExactlyOnceWith(PROGRAM);
        expect(decodeInstructionFallback).not.toHaveBeenCalled();
        expect(entries[0]).toMatchObject({
            decoded: { info: { amount: 42n }, program: 'pump', type: 'buy' },
            source: 'idl',
        });
    });

    it('should name the IDL-declared accounts and derive the token ui amount', async () => {
        const accounts = [
            staticAccount(SOURCE, { writable: true }),
            staticAccount(MINT),
            staticAccount(DESTINATION, { writable: true }),
            staticAccount(AUTHORITY, { signer: true }),
            staticAccount(TOKEN_PROGRAM_ADDRESS),
        ];
        const resolveIdlClient = vi.fn().mockResolvedValue(createIdlClient(TRANSFER_CHECKED_IDL));

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [{ accounts: [0, 1, 2, 3], data: TRANSFER_CHECKED_DATA, programIdIndex: 4 }],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(entries[0]).toMatchObject({
            decoded: {
                accounts: { authority: AUTHORITY, destination: DESTINATION, mint: MINT, source: SOURCE },
                info: { amount: 100_000n, decimals: 6, discriminator: 12 },
                ui_amount: '0.1',
            },
            source: 'idl',
        });
    });

    it('should leave accounts past the IDL-declared list out of the named set', async () => {
        const EXTRA_SIGNER = '5KVJxNFPBGhZQZDQ7GFMExFtMmRh8TAjXzD4Jqr6SKwZ';
        const accounts = [
            staticAccount(SOURCE, { writable: true }),
            staticAccount(MINT),
            staticAccount(DESTINATION, { writable: true }),
            staticAccount(AUTHORITY),
            staticAccount(EXTRA_SIGNER, { signer: true }),
            staticAccount(TOKEN_PROGRAM_ADDRESS),
        ];
        const resolveIdlClient = vi.fn().mockResolvedValue(createIdlClient(TRANSFER_CHECKED_IDL));

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [{ accounts: [0, 1, 2, 3, 4], data: TRANSFER_CHECKED_DATA, programIdIndex: 5 }],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(entries[0].accounts).toContain(EXTRA_SIGNER);
        expect(Object.values(entries[0].decoded?.accounts ?? {})).not.toContain(EXTRA_SIGNER);
    });

    it('should omit decoded accounts entirely when the IDL declares none', async () => {
        const accounts = [
            staticAccount(AUTHORITY, { signer: true, writable: true }),
            staticAccount(COMPUTE_BUDGET_PROGRAM),
        ];
        const resolveIdlClient = vi.fn().mockResolvedValue(createIdlClient(SET_COMPUTE_UNIT_LIMIT_IDL));

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [{ accounts: [], data: SET_COMPUTE_UNIT_LIMIT_DATA, programIdIndex: 1 }],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(entries[0]).toMatchObject({ decoded: { info: { units: 200_000 } }, source: 'idl' });
        expect(entries[0].decoded).not.toHaveProperty('accounts');
    });

    it('should resolve each unique program once across outer and inner instructions', async () => {
        const PROGRAM_A = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const PROGRAM_B = 'Vote111111111111111111111111111111111111111';
        const accounts = [
            staticAccount(SOURCE, { signer: true, writable: true }),
            staticAccount(PROGRAM_A),
            staticAccount(PROGRAM_B),
        ];
        const resolveIdlClient = vi.fn().mockResolvedValue(null);

        await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                innerInstructions: [{ index: 0, instructions: [{ accounts: [0], data: 'cpi', programIdIndex: 2 }] }],
                instructions: [
                    { accounts: [0], data: 'a', programIdIndex: 1 },
                    { accounts: [0], data: 'b', programIdIndex: 1 },
                ],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(resolveIdlClient).toHaveBeenCalledTimes(2);
        expect(resolveIdlClient).toHaveBeenCalledWith(PROGRAM_A);
        expect(resolveIdlClient).toHaveBeenCalledWith(PROGRAM_B);
    });

    it('should fall past the IDL rung when the client cannot decode or lacks a name', async () => {
        const PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const accounts = [staticAccount(SOURCE, { signer: true, writable: true }), staticAccount(PROGRAM)];
        const idlClient = {
            decodeInstruction: vi
                .fn()
                .mockReturnValueOnce({ errors: [], kind: 'unknown' })
                .mockReturnValueOnce({ decoded: { ok: true }, kind: 'anchor' }),
            getDecodedData: vi.fn().mockReturnValue({ ok: true }),
            instructionName: vi.fn().mockReturnValue(undefined),
            programName: vi.fn().mockReturnValue(undefined),
        } as never;
        const resolveIdlClient = vi.fn().mockResolvedValue(idlClient);

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [
                    { accounts: [0], data: 'a', programIdIndex: 1 },
                    { accounts: [0], data: 'b', programIdIndex: 1 },
                ],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(entries[0].source).toBe('raw');
        expect(entries[1]).toMatchObject({
            decoded: { info: { ok: true }, type: 'unknown' },
            source: 'idl',
        });
        expect(entries[1].decoded).not.toHaveProperty('program');
    });

    it('should warn and continue when the IDL client throws', async () => {
        const PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const accounts = [staticAccount(SOURCE, { signer: true, writable: true }), staticAccount(PROGRAM)];
        const idlClient = {
            decodeInstruction: vi.fn().mockImplementation(() => {
                throw new Error('client exploded');
            }),
        } as never;
        const resolveIdlClient = vi.fn().mockResolvedValue(idlClient);

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [{ accounts: [0], data: 'a', programIdIndex: 1 }],
                resolvedAccounts: accounts,
            }),
            { logger, resolveIdlClient },
        );

        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] idl instruction decode failed',
            expect.objectContaining({ programId: PROGRAM }),
        );
        expect(entries[0].source).toBe('raw');
    });

    it('should fall past an unrecognized system discriminator to the fallback', async () => {
        const SYSTEM_PROGRAM = '11111111111111111111111111111111';
        const accounts = [
            staticAccount('So11111111111111111111111111111111111111112', { signer: true, writable: true }),
            staticAccount(SYSTEM_PROGRAM),
        ];
        const decodeInstructionFallback = vi.fn().mockReturnValue({ info: {}, type: 'opaque' });

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [
                    {
                        accounts: [0],
                        data: getBase58Decoder().decode(new Uint8Array([250, 0, 0, 0])),
                        programIdIndex: 1,
                    },
                ],
                resolvedAccounts: accounts,
            }),
            { decodeInstructionFallback, logger },
        );

        expect(decodeInstructionFallback).toHaveBeenCalledTimes(1);
        expect(entries[0]).toMatchObject({ decoded: { info: {}, type: 'opaque' }, source: 'bundled' });
    });

    it('should warn and continue when the bundled decoder cannot rebuild the instruction', async () => {
        const SYSTEM_PROGRAM = '11111111111111111111111111111111';
        const accounts = [
            staticAccount('not-a-valid-address', { signer: true, writable: true }),
            staticAccount(SYSTEM_PROGRAM),
        ];

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [
                    {
                        accounts: [0],
                        data: getBase58Decoder().decode(new Uint8Array([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0])),
                        programIdIndex: 1,
                    },
                ],
                resolvedAccounts: accounts,
            }),
            { logger },
        );

        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] bundled instruction decode failed',
            expect.objectContaining({ programId: SYSTEM_PROGRAM }),
        );
        expect(entries[0].source).toBe('raw');
    });

    it('should fall past a malformed token batch to the fallback and warn', async () => {
        const accounts = [
            staticAccount('So11111111111111111111111111111111111111112', { signer: true, writable: true }),
            staticAccount(TOKEN_PROGRAM_ADDRESS),
        ];
        const decodeInstructionFallback = vi.fn().mockReturnValue({ info: {}, type: 'opaque' });

        const entries = await decodeTransactionInstructions(
            makeContext({
                accountKeys: accounts.map(account => account.address),
                instructions: [
                    {
                        accounts: [0],
                        // Sub-instruction announces 9 data bytes but the buffer ends — the batch decoder throws.
                        data: getBase58Decoder().decode(new Uint8Array([0xff, 0, 9])),
                        programIdIndex: 1,
                    },
                ],
                resolvedAccounts: accounts,
            }),
            { decodeInstructionFallback, logger },
        );

        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] token batch instruction decode failed',
            expect.objectContaining({ programId: TOKEN_PROGRAM_ADDRESS }),
        );
        expect(decodeInstructionFallback).toHaveBeenCalledTimes(1);
        expect(entries[0]).toMatchObject({ decoded: { info: {}, type: 'opaque' }, source: 'bundled' });
    });
});
