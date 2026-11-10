import { type InstructionSummary } from '@entities/transaction-data';
import { renderHook } from '@testing-library/react';
import { LIGHTHOUSE_PROGRAM_ADDRESS } from 'lighthouse-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useProgramIdlNames, useRowTransaction } = vi.hoisted(() => ({
    useProgramIdlNames: vi.fn(),
    useRowTransaction: vi.fn(),
}));
vi.mock('../use-row-transaction', () => ({ useRowTransaction }));
// `useResolvedSummaryNames` reaches the IDL fetch through the cross-entity `@x` path, so the mock targets it.
vi.mock('@entities/idl/@x/transaction-data', () => ({ useProgramIdlNames }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 2, url: 'https://api.devnet.solana.com' }) }));

import { useResolvedRowTransaction } from '../use-resolved-row-transaction';
import type { RowTransactionState } from '../use-row-transaction';

const ZK_PROGRAM = 'ZkE1Gama1Proof11111111111111111111111111111';

function unknown(programId: string, disc: number): InstructionSummary {
    return {
        name: 'Unknown Instruction',
        nameLookup: { data: Uint8Array.from([disc]), programId },
        programName: 'p',
    };
}

afterEach(() => vi.clearAllMocks());

describe('useResolvedRowTransaction', () => {
    it('should replace the placeholder with the IDL-resolved name', () => {
        useRowTransaction.mockReturnValue(loaded([unknown('Prog1', 1)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(summariesOf(result.current)[0].name).toBe('Vote');
    });

    it('should replace the placeholder program with the IDL program name', () => {
        useRowTransaction.mockReturnValue(loaded([unknown('Prog1', 1)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(summariesOf(result.current)[0]).toMatchObject({ name: 'Vote', programName: 'Voting' });
    });

    it('should name the program even when the instruction data is unresolved', () => {
        useRowTransaction.mockReturnValue(loaded([unknown('Prog1', 9)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(summariesOf(result.current)[0]).toMatchObject({ name: 'Unknown Instruction', programName: 'Voting' });
    });

    it('should resolve ZK ElGamal names synchronously from the data, without an IDL resolver', () => {
        useRowTransaction.mockReturnValue(loaded([unknown(ZK_PROGRAM, 3)]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        // data 3 = Verify Ciphertext-Commitment Equality
        expect(summariesOf(result.current)[0].name).toBe('Verify Ciphertext-Commitment Equality');
    });

    it('should resolve Lighthouse names synchronously from the data, without an IDL resolver', () => {
        useRowTransaction.mockReturnValue(loaded([unknown(LIGHTHOUSE_PROGRAM_ADDRESS, 15)]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        // data 15 = Assert Sysvar Clock
        expect(summariesOf(result.current)[0].name).toBe('Assert Sysvar Clock');
    });

    it('should keep the placeholder when no resolver names it', () => {
        useRowTransaction.mockReturnValue(loaded([unknown('Prog1', 9)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(summariesOf(result.current)[0].name).toBe('Unknown Instruction');
    });

    it('should leave instructions without a nameLookup untouched', () => {
        useRowTransaction.mockReturnValue(loaded([{ name: 'Transfer', programName: 'System Program' }]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(result.current).toEqual(loaded([{ name: 'Transfer', programName: 'System Program' }]));
    });

    it('should pass the looked-up programs to the resolver hook', () => {
        useRowTransaction.mockReturnValue(
            loaded([unknown('Prog1', 1), unknown('Prog2', 1), { name: 'Transfer', programName: 'System Program' }]),
        );
        useProgramIdlNames.mockReturnValue(new Map());

        renderHook(() => useResolvedRowTransaction('sig'));

        expect(useProgramIdlNames).toHaveBeenCalledWith(['Prog1', 'Prog2'], 2, 'https://api.devnet.solana.com');
    });

    it('should pass the loading state through', () => {
        useRowTransaction.mockReturnValue({ status: 'loading' });
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(result.current).toEqual({ status: 'loading' });
    });

    it('should pass the failed state through with its retry', () => {
        const retry = vi.fn();
        useRowTransaction.mockReturnValue({ retry, status: 'failed' });
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedRowTransaction('sig'));

        expect(result.current).toEqual({ retry, status: 'failed' });
    });
});

const MESSAGE_BYTES = new Uint8Array([1, 2, 3]);

function loaded(summaries: InstructionSummary[]): RowTransactionState {
    return { messageBytes: MESSAGE_BYTES, status: 'loaded', summaries };
}

function summariesOf(state: RowTransactionState): readonly InstructionSummary[] {
    if (state.status !== 'loaded') throw new Error(`expected loaded summaries, got ${state.status}`);
    return state.summaries;
}
