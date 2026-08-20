import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useProgramIdlNames } = vi.hoisted(() => ({ useProgramIdlNames: vi.fn() }));
vi.mock('@entities/idl/@x/transaction-data', () => ({ useProgramIdlNames }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: Cluster.MainnetBeta, url: MAINNET_URL }) }));

import type { InstructionSummary, NamedInstruction } from '../../lib/types';
import { useResolvedInstructionNames, useResolvedSummaryNames } from '../use-resolved-instruction-names';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const ZK_PROGRAM = 'ZkE1Gama1Proof11111111111111111111111111111';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
// Two programs the explorer has no name table entry for, so only a resolver can name them.
const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const WHIRLPOOL = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';

// No IDLs by default; the tests that need them override this.
beforeEach(() => useProgramIdlNames.mockReturnValue(new Map()));
afterEach(() => vi.clearAllMocks());

describe('useResolvedInstructionNames', () => {
    it('should name an instruction from the IDL resolver map', () => {
        useProgramIdlNames.mockReturnValue(
            new Map([[JUPITER, { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionNames([unnamed(JUPITER, 1)]));

        expect(result.current[0]).toMatchObject({ name: 'Vote', programName: 'Voting' });
    });

    // The IDL is the last source and the only one that fetches; an empty map is not "nothing named yet".
    it('should name an instruction with no IDL in the map', () => {
        const { result } = renderHook(() => useResolvedInstructionNames([unnamed(ZK_PROGRAM, 3)]));

        // data 3 = Verify Ciphertext-Commitment Equality
        expect(result.current[0].name).toBe('Verify Ciphertext-Commitment Equality');
    });

    it('should drop nameLookup once a row is named', () => {
        useProgramIdlNames.mockReturnValue(
            new Map([[JUPITER, { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionNames([unnamed(JUPITER, 1)]));

        expect(result.current[0]).not.toHaveProperty('nameLookup');
    });

    // A row that loses its lookup while unnamed can never be named — nothing is left to resolve.
    it('should keep nameLookup on a row nothing named', () => {
        const { result } = renderHook(() => useResolvedInstructionNames([unnamed(JUPITER, 1)]));

        expect(result.current[0].name).toBeUndefined();
        expect(result.current[0].nameLookup).toBeDefined();
    });

    // Callers pair row `i` with `instructionLogs[i]`, so a dropped row shifts every later CU figure.
    it('should preserve row count and order, named rows included', () => {
        const rows = [unnamed(JUPITER, 1), named('Transfer'), unnamed(WHIRLPOOL, 1)];

        const { result } = renderHook(() => useResolvedInstructionNames(rows));

        expect(result.current).toHaveLength(3);
        expect(result.current[1]).toMatchObject({ name: 'Transfer', programName: 'System Program' });
    });

    it('should fetch IDLs only for the programs of rows that are still unnamed', () => {
        renderHook(() => useResolvedInstructionNames([unnamed(JUPITER, 1), named('Transfer'), unnamed(WHIRLPOOL, 1)]));

        expect(useProgramIdlNames).toHaveBeenCalledWith([JUPITER, WHIRLPOOL], Cluster.MainnetBeta, MAINNET_URL);
    });
});

describe('useResolvedSummaryNames', () => {
    it('should return undefined while the transaction is still loading', () => {
        const { result } = renderHook(() => useResolvedSummaryNames(undefined));

        expect(result.current).toBeUndefined();
        expect(useProgramIdlNames).toHaveBeenCalledWith([], Cluster.MainnetBeta, MAINNET_URL);
    });

    it('should replace the sentinel and drop nameLookup once a row is named', () => {
        useProgramIdlNames.mockReturnValue(
            new Map([[JUPITER, { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedSummaryNames([unnamedSummary(JUPITER, 1)]));

        expect(result.current).toEqual([{ name: 'Vote', programName: 'Voting' }]);
    });

    // The row is still unnamed, so it keeps the lookup a later resolver needs — see InstructionNames.
    it('should keep nameLookup when only the program name resolved', () => {
        useProgramIdlNames.mockReturnValue(
            new Map([[JUPITER, { programName: 'Voting', resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedSummaryNames([unnamedSummary(JUPITER, 9)]));

        expect(result.current?.[0]).toMatchObject({ name: 'Unknown Instruction', programName: 'Voting' });
        expect(result.current?.[0].nameLookup).toBeDefined();
    });

    it('should fetch IDLs only for the programs of rows that are still unnamed', () => {
        renderHook(() =>
            useResolvedSummaryNames([unnamedSummary(JUPITER, 1), { name: 'Transfer', programName: 'System Program' }]),
        );

        expect(useProgramIdlNames).toHaveBeenCalledWith([JUPITER], Cluster.MainnetBeta, MAINNET_URL);
    });
});

function unnamed(programId: string, disc: number): NamedInstruction {
    return {
        name: undefined,
        nameLookup: { data: Uint8Array.from([disc]), programId },
        programId: new PublicKey(programId),
        programName: undefined,
    };
}

function named(name: string): NamedInstruction {
    return { name, programId: new PublicKey(SYSTEM_PROGRAM), programName: 'System Program' };
}

function unnamedSummary(programId: string, disc: number): InstructionSummary {
    return {
        name: 'Unknown Instruction',
        nameLookup: { data: Uint8Array.from([disc]), programId },
        programName: 'Unknown Program',
    };
}
