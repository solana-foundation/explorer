import { type InstructionSummary } from '@entities/transaction-data';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useInstructionSummaries, useInstructionNameResolvers } = vi.hoisted(() => ({
    useInstructionNameResolvers: vi.fn(),
    useInstructionSummaries: vi.fn(),
}));
vi.mock('../use-instruction-summaries', () => ({ useInstructionSummaries }));
vi.mock('@entities/idl', () => ({ useInstructionNameResolvers }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 2, url: 'https://api.devnet.solana.com' }) }));

import { useResolvedInstructionSummaries } from '../use-resolved-instruction-summaries';

const ZK_PROGRAM = 'ZkE1Gama1Proof11111111111111111111111111111';

function unknown(programId: string, disc: number): InstructionSummary {
    return {
        name: 'Unknown Instruction',
        nameLookup: { discriminator: Uint8Array.from([disc]), programId },
        program: 'p',
    };
}

afterEach(() => vi.clearAllMocks());

describe('useResolvedInstructionSummaries', () => {
    it('should replace the placeholder with the IDL-resolved name', () => {
        useInstructionSummaries.mockReturnValue([unknown('Prog1', 1)]);
        useInstructionNameResolvers.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current?.[0].name).toBe('Vote');
    });

    it('should replace the placeholder program with the IDL program name', () => {
        useInstructionSummaries.mockReturnValue([unknown('Prog1', 1)]);
        useInstructionNameResolvers.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => 'Vote' }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current?.[0]).toMatchObject({ name: 'Vote', program: 'Voting' });
    });

    it('should name the program even when the instruction discriminator is unresolved', () => {
        useInstructionSummaries.mockReturnValue([unknown('Prog1', 9)]);
        useInstructionNameResolvers.mockReturnValue(
            new Map([['Prog1', { programName: 'Voting', resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current?.[0]).toMatchObject({ name: 'Unknown Instruction', program: 'Voting' });
    });

    it('should resolve ZK ElGamal names synchronously from the discriminator, without an IDL resolver', () => {
        useInstructionSummaries.mockReturnValue([unknown(ZK_PROGRAM, 3)]);
        useInstructionNameResolvers.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        // discriminator 3 = Verify Ciphertext-Commitment Equality
        expect(result.current?.[0].name).toBe('Verify Ciphertext-Commitment Equality');
    });

    it('should keep the placeholder when no resolver names it', () => {
        useInstructionSummaries.mockReturnValue([unknown('Prog1', 9)]);
        useInstructionNameResolvers.mockReturnValue(
            new Map([['Prog1', { programName: undefined, resolveInstructionName: () => undefined }]]),
        );

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current?.[0].name).toBe('Unknown Instruction');
    });

    it('should leave instructions without a lookup hint untouched', () => {
        useInstructionSummaries.mockReturnValue([{ name: 'Transfer', program: 'System Program' }]);
        useInstructionNameResolvers.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current).toEqual([{ name: 'Transfer', program: 'System Program' }]);
    });

    it('should pass the hinted programs to the resolver hook', () => {
        useInstructionSummaries.mockReturnValue([
            unknown('Prog1', 1),
            unknown('Prog2', 1),
            { name: 'Transfer', program: 'System Program' },
        ]);
        useInstructionNameResolvers.mockReturnValue(new Map());

        renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(useInstructionNameResolvers).toHaveBeenCalledWith(
            ['Prog1', 'Prog2'],
            2,
            'https://api.devnet.solana.com',
        );
    });

    it('should return undefined while instruction info is loading', () => {
        useInstructionSummaries.mockReturnValue(undefined);
        useInstructionNameResolvers.mockReturnValue(new Map());

        const { result } = renderHook(() => useResolvedInstructionSummaries('sig'));

        expect(result.current).toBeUndefined();
    });
});
