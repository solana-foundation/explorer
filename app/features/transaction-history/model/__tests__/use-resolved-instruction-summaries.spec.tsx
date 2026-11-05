import { type InstructionSummary } from '@entities/transaction-data';
import { renderHook } from '@testing-library/react';
import { LIGHTHOUSE_PROGRAM_ADDRESS } from 'lighthouse-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useInstructionSummaries, useProgramIdlNames } = vi.hoisted(() => ({
    useInstructionSummaries: vi.fn(),
    useProgramIdlNames: vi.fn(),
}));
vi.mock('../use-instruction-summaries', () => ({ useInstructionSummaries }));
// The `@x` path: `useResolvedSummaryNames` reaches the fetch through the cross-entity API.
vi.mock('@entities/idl/@x/transaction-data', () => ({ useProgramIdlNames }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 2, url: 'https://api.devnet.solana.com' }) }));

import type { InstructionSummariesState } from '../use-instruction-summaries';
import { useResolvedInstructionSummaries } from '../use-resolved-instruction-summaries';

const ZK_PROGRAM = 'ZkE1Gama1Proof11111111111111111111111111111';

function unknown(programId: string, disc: number): InstructionSummary {
    return {
        name: 'Unknown Instruction',
        nameLookup: { data: Uint8Array.from([disc]), programId },
        programName: 'p',
    };
}

afterEach(() => vi.clearAllMocks());

describe('useResolvedInstructionSummaries', () => {
    it('should replace the placeholder with the IDL-resolved name', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown('Prog1', 1)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(summariesOf(result.current)[0].name).toBe('Vote');
    });

    it('should replace the placeholder program with the IDL program name', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown('Prog1', 1)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(summariesOf(result.current)[0]).toMatchObject({ name: 'Vote', programName: 'Voting' });
    });

    it('should name the program even when the instruction data is unresolved', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown('Prog1', 9)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(summariesOf(result.current)[0]).toMatchObject({ name: 'Unknown Instruction', programName: 'Voting' });
    });

    it('should resolve ZK ElGamal names synchronously from the data, without an IDL resolver', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown(ZK_PROGRAM, 3)]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        // data 3 = Verify Ciphertext-Commitment Equality
        expect(summariesOf(result.current)[0].name).toBe('Verify Ciphertext-Commitment Equality');
    });

    it('should resolve Lighthouse names synchronously from the data, without an IDL resolver', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown(LIGHTHOUSE_PROGRAM_ADDRESS, 15)]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        // data 15 = Assert Sysvar Clock
        expect(summariesOf(result.current)[0].name).toBe('Assert Sysvar Clock');
    });

    it('should keep the placeholder when no resolver names it', () => {
        useInstructionSummaries.mockReturnValue(loaded([unknown('Prog1', 9)]));
        useProgramIdlNames.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(summariesOf(result.current)[0].name).toBe('Unknown Instruction');
    });

    it('should leave instructions without a nameLookup untouched', () => {
        useInstructionSummaries.mockReturnValue(loaded([{ name: 'Transfer', programName: 'System Program' }]));
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(summariesOf(result.current)).toEqual([{ name: 'Transfer', programName: 'System Program' }]);
    });

    it('should pass the looked-up programs to the resolver hook', () => {
        useInstructionSummaries.mockReturnValue(
            loaded([unknown('Prog1', 1), unknown('Prog2', 1), { name: 'Transfer', programName: 'System Program' }]),
        );
        useProgramIdlNames.mockReturnValue(new Map());

        renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(useProgramIdlNames).toHaveBeenCalledWith(['Prog1', 'Prog2'], 2, 'https://api.devnet.solana.com');
    });

    it('should pass the loading state through', () => {
        useInstructionSummaries.mockReturnValue({ status: 'loading' });
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current).toEqual({ status: 'loading' });
    });

    it('should pass the failed state through with its retry', () => {
        const retry = vi.fn();
        useInstructionSummaries.mockReturnValue({ retry, status: 'failed' });
        useProgramIdlNames.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current).toEqual({ retry, status: 'failed' });
    });
});

function loaded(summaries: InstructionSummary[]): InstructionSummariesState {
    return { status: 'loaded', summaries };
}

function summariesOf(state: InstructionSummariesState): InstructionSummary[] {
    if (state.status !== 'loaded') throw new Error(`expected loaded summaries, got ${state.status}`);
    return state.summaries;
}
