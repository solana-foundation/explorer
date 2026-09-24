import { gen } from '@__fixtures__/gen';
import { getBase58Decoder } from '@solana/kit';
import {
    ComputeBudgetProgram,
    type ParsedInstruction,
    type PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    findTransactionCluster: vi.fn(),
    getIdlNames: vi.fn(),
    getTx: vi.fn(),
}));

// Only the probe is faked. The naming path runs for real, because these tests exist to prove the image
// lists the same names transaction-history does. Deep paths rather than `importActual` of the barrel:
// the barrel also exports hook modules this spec has no reason to load.
vi.mock('@entities/transaction-data', async () => {
    const summaries = await vi.importActual<typeof import('@entities/transaction-data/lib/instruction-summary')>(
        '@entities/transaction-data/lib/instruction-summary',
    );
    const names = await vi.importActual<typeof import('@entities/transaction-data/lib/name-sources')>(
        '@entities/transaction-data/lib/name-sources',
    );
    const version = await vi.importActual<typeof import('@entities/transaction-data/lib/format-transaction-version')>(
        '@entities/transaction-data/lib/format-transaction-version',
    );

    return {
        applyNameSourcesToSummaries: names.applyNameSourcesToSummaries,
        formatTransactionVersion: version.formatTransactionVersion,
        getInstructionSummaries: summaries.getInstructionSummaries,
    };
});
// The probe moved to the entity's server barrel, so it needs its own mock: the barrel factory above no
// longer intercepts it.
vi.mock('@entities/transaction-data/server', () => ({ findTransactionCluster: mocks.findTransactionCluster }));
vi.mock('../../api/get-tx', () => ({ getTx: mocks.getTx }));
vi.mock('../../api/get-idl-names', () => ({ getIdlNames: mocks.getIdlNames }));

import { MAX_INSTRUCTION_ROWS } from '../../lib/constants';
import { getTxShareData } from '../get-tx-share-data';

const SIGNATURE = gen.signature(1);

// Seeded, so this is the fixed instant 2023-11-15T22:13:20Z. `dateUtc` is asserted against a literal
// rather than a string this test recomputes with the same formatter it is checking.
const BLOCK_TIME = gen.timestamp(1);

const BASE58_DECODER = getBase58Decoder();
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const SIGNER = gen.publicKey(1);

// RPC-parsed: `getInstructionSummaries` reads the name straight off `parsed.type`, no source needed.
const TRANSFER = {
    parsed: { info: {}, type: 'transfer' },
    program: 'system',
    programId: SystemProgram.programId,
} as unknown as ParsedInstruction;

// The byte path: nothing names this until `applyNameSourcesToSummaries` runs the memo source over it.
const MEMO: PartiallyDecodedInstruction = {
    accounts: [],
    data: BASE58_DECODER.decode(new Uint8Array([0x67, 0x6d])),
    programId: MEMO_PROGRAM,
};

// Dropped by `getInstructionSummaries` on purpose - fee boilerplate that says nothing about the tx.
const SET_COMPUTE_UNIT_LIMIT: PartiallyDecodedInstruction = {
    accounts: [],
    data: BASE58_DECODER.decode(new Uint8Array([2, 0x40, 0x0d, 0x03, 0x00])),
    programId: ComputeBudgetProgram.programId,
};

// An unparsed instruction from a program no byte-level source knows, which is the only case an IDL can
// improve. Stage 1 leaves it `Unknown Instruction` / `Unknown Program` and hands on a `nameLookup`.
const JUPITER = gen.publicKey(2);
const ROUTE_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

const ROUTE: PartiallyDecodedInstruction = {
    accounts: [],
    data: BASE58_DECODER.decode(ROUTE_DATA),
    programId: JUPITER,
};

// Stands in for a real discriminator table, which is a byte-prefix compare. The table itself is tested in
// `instruction-name-table.spec.ts`; what matters here is that the map reaches stage 3 intact.
const jupiterNames = {
    programName: 'Jupiter Aggregator V6',
    resolveInstructionName: (data: Uint8Array) => (data[0] === 1 ? 'Route' : undefined),
};

/** One unparsed instruction per program, so a transaction can overflow the row cap with distinct programs. */
function unparsedFrom(programId: PublicKey): PartiallyDecodedInstruction {
    return { accounts: [], data: BASE58_DECODER.decode(ROUTE_DATA), programId };
}

function txWith(instructions: (ParsedInstruction | PartiallyDecodedInstruction)[], err: unknown = null) {
    return {
        blockTime: BLOCK_TIME,
        meta: { computeUnitsConsumed: 4321, err, fee: 5000 },
        // A number, not gen's bigint: `TransactionWithMeta.slot` is web3.js', which is a number.
        slot: Number(gen.slot(1)),
        transaction: { message: { accountKeys: [{ pubkey: SIGNER }], instructions }, signatures: [] },
        version: 0,
    };
}

const TX = txWith([]);

beforeEach(() => {
    mocks.getTx.mockResolvedValue(TX);
    mocks.getIdlNames.mockResolvedValue(new Map());
});

afterEach(() => vi.clearAllMocks());

describe('should shape the transaction behind an OG image', () => {
    it('should fetch from the cluster the request carried, without probing', async () => {
        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(mocks.findTransactionCluster).not.toHaveBeenCalled();
        expect(mocks.getTx).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            cluster: Cluster.Devnet,
            signature: SIGNATURE,
        });
        expect(result).toEqual({
            data: {
                dateUtc: 'Nov 15, 2023 at 22:13:20 UTC',
                fee: '0.000005 SOL',
                instructions: [],
                signature: SIGNATURE,
                signer: SIGNER.toBase58(),
                slot: Number(gen.slot(1)),
                status: 'success',
                version: 'v0',
            },
            kind: 'ok',
        });
    });

    it('should probe mainnet only when the request carried no cluster', async () => {
        mocks.findTransactionCluster.mockResolvedValue({ cluster: Cluster.MainnetBeta, kind: 'found' });

        const result = await getTxShareData(SIGNATURE);

        expect(mocks.findTransactionCluster).toHaveBeenCalledWith([Cluster.MainnetBeta], SIGNATURE, {
            abortSignal: expect.any(AbortSignal),
        });
        expect(mocks.getTx).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            cluster: Cluster.MainnetBeta,
            signature: SIGNATURE,
        });
        expect(result.kind).toBe('ok');
    });

    it('should print a placeholder when the transaction has no block time', async () => {
        mocks.getTx.mockResolvedValue({ ...TX, blockTime: null });

        const result = await getTxShareData(SIGNATURE, Cluster.MainnetBeta);

        expect(result).toMatchObject({ data: { dateUtc: '-' }, kind: 'ok' });
    });

    it('should leave the fee and the status absent when the transaction carries no meta', async () => {
        mocks.getTx.mockResolvedValue({ ...TX, meta: null });

        const result = await getTxShareData(SIGNATURE, Cluster.MainnetBeta);

        expect(result).toMatchObject({ kind: 'ok' });
        expect(result).toHaveProperty('data.fee', undefined);
        expect(result).toHaveProperty('data.status', undefined);
    });
});

describe('should map every failure to a result rather than throwing', () => {
    it('should report not-found when no cluster carries the signature', async () => {
        mocks.findTransactionCluster.mockResolvedValue({ kind: 'not-found' });

        await expect(getTxShareData(SIGNATURE)).resolves.toEqual({ kind: 'not-found' });
        expect(mocks.getTx).not.toHaveBeenCalled();
    });

    it('should report an error when the probe could not reach a cluster', async () => {
        mocks.findTransactionCluster.mockResolvedValue({
            cluster: Cluster.MainnetBeta,
            error: new Error('rpc unreachable'),
            kind: 'error',
        });

        await expect(getTxShareData(SIGNATURE)).resolves.toEqual({ kind: 'error' });
        expect(mocks.getTx).not.toHaveBeenCalled();
    });

    it('should report not-found when the cluster has no such transaction', async () => {
        mocks.getTx.mockResolvedValue(null);

        await expect(getTxShareData(SIGNATURE, Cluster.Devnet)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should report an error when the fetch throws', async () => {
        mocks.getTx.mockRejectedValue(new Error('unexpected error'));

        await expect(getTxShareData(SIGNATURE, Cluster.Devnet)).resolves.toEqual({ kind: 'error' });
    });
});

describe('should name the instructions the image lists', () => {
    it('should name a parsed instruction from its type', async () => {
        mocks.getTx.mockResolvedValue(txWith([TRANSFER]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({
            data: { instructions: [{ name: 'Transfer', programName: 'System Program' }] },
            kind: 'ok',
        });
    });

    it('should name an unparsed instruction from its bytes with no IDL fetch', async () => {
        mocks.getTx.mockResolvedValue(txWith([MEMO]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({
            data: { instructions: [{ name: 'Memo', programName: 'Memo Program' }] },
            kind: 'ok',
        });
    });

    it('should drop Compute Budget instructions from the list', async () => {
        mocks.getTx.mockResolvedValue(txWith([SET_COMPUTE_UNIT_LIMIT, TRANSFER, MEMO]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({
            data: {
                instructions: [
                    { name: 'Transfer', programName: 'System Program' },
                    { name: 'Memo', programName: 'Memo Program' },
                ],
            },
            kind: 'ok',
        });
    });
});

describe('should report whether the transaction succeeded', () => {
    it('should read a null error as success', async () => {
        mocks.getTx.mockResolvedValue(txWith([TRANSFER]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({ data: { status: 'success' }, kind: 'ok' });
    });

    it('should read a present error as failed', async () => {
        mocks.getTx.mockResolvedValue(txWith([TRANSFER], { InstructionError: [0, 'InvalidAccountData'] }));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({ data: { status: 'failed' }, kind: 'ok' });
    });
});

describe('should carry the footer fields', () => {
    it('should read the signer off the first account key', async () => {
        mocks.getTx.mockResolvedValue(txWith([]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({ data: { signer: SIGNER.toBase58() }, kind: 'ok' });
    });

    it('should format the version through the shared helper', async () => {
        mocks.getTx.mockResolvedValue({ ...txWith([]), version: 1 });

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(result).toMatchObject({ data: { version: 'v1' }, kind: 'ok' });
    });

    it('should omit the version when the transaction carries none', async () => {
        mocks.getTx.mockResolvedValue({ ...txWith([]), version: undefined });

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect((result as { data: { version?: string } }).data.version).toBeUndefined();
    });
});

describe('should name the instructions only an IDL can name', () => {
    it('should name an instruction and its program from the IDL map', async () => {
        mocks.getTx.mockResolvedValue(txWith([ROUTE]));
        mocks.getIdlNames.mockResolvedValue(new Map([[JUPITER.toBase58(), jupiterNames]]));

        const result = await getTxShareData(SIGNATURE, Cluster.Devnet);

        // Both halves of the row come from one map entry: `resolveNamesFromLookup` reads the instruction
        // resolver and the program name off the same value.
        expect(result).toMatchObject({
            data: { instructions: [{ name: 'Route', programName: 'Jupiter Aggregator V6' }] },
            kind: 'ok',
        });
    });

    it('should ask for the unnamed program on the cluster it resolved', async () => {
        mocks.getTx.mockResolvedValue(txWith([ROUTE]));

        await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(mocks.getIdlNames).toHaveBeenCalledWith({
            cluster: Cluster.Devnet,
            programIds: [JUPITER.toBase58()],
        });
    });

    // A row the RPC already named carries no `nameLookup`, so there is nothing an IDL could improve.
    it('should ask for nothing when the RPC already named every row', async () => {
        mocks.getTx.mockResolvedValue(txWith([TRANSFER]));

        await getTxShareData(SIGNATURE, Cluster.Devnet);

        expect(mocks.getIdlNames).toHaveBeenCalledWith({ cluster: Cluster.Devnet, programIds: [] });
    });

    it('should ask only for the programs in the rows the image draws', async () => {
        const programs = Array.from({ length: MAX_INSTRUCTION_ROWS + 2 }, (_, index) => gen.publicKey(index + 10));
        mocks.getTx.mockResolvedValue(txWith(programs.map(unparsedFrom)));

        await getTxShareData(SIGNATURE, Cluster.Devnet);

        // Rows past the cap collapse into "and N more", so resolving their IDLs buys nothing but latency.
        expect(mocks.getIdlNames).toHaveBeenCalledWith({
            cluster: Cluster.Devnet,
            programIds: programs.slice(0, MAX_INSTRUCTION_ROWS).map(program => program.toBase58()),
        });
    });
});
