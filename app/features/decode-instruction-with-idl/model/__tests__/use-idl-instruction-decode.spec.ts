// @vitest-environment jsdom

import { type ProgramIdls } from '@entities/idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIdlInstructionDecode } from '../use-idl-instruction-decode';

// Mock the resolution boundary + the decode helper so the test pins the hook's own job — candidate choice,
// argument forwarding, and gating — not the SWR/decode machinery (each tested in its own slice). The
// panic→Unknown degrade is `safeDecodeInstructionWithIdl`'s responsibility and is tested with the lib.
const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };
const safeDecodeInstructionWithIdl = vi.fn();

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({ useProgramIdls: () => idlState }));
vi.mock('../../lib/decode-instruction-with-idl', () => ({
    safeDecodeInstructionWithIdl: (...a: unknown[]) => safeDecodeInstructionWithIdl(...a),
}));

const raw = new TransactionInstruction({ data: Buffer.from([1, 2, 3]), keys: [], programId: PublicKey.unique() });
const programId = raw.programId.toString();
const anchorIdl = { kind: 'anchor' } as never;
const pmpIdl = { kind: 'pmp' } as never;
const ANCHOR = { address: undefined, idl: anchorIdl, source: 'anchor', standard: 'Anchor' } as const;
const PMP = { address: undefined, idl: pmpIdl, source: 'programMetadata', standard: 'Codama' } as const;

describe('useIdlInstructionDecode', () => {
    beforeEach(() => {
        safeDecodeInstructionWithIdl.mockReset();
        idlState.candidates = [];
    });

    it('should decode with the first candidate', () => {
        idlState.candidates = [PMP, ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, pmpIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'codama' });
    });

    it('should return undefined and not decode while the on-chain IDLs load', () => {
        idlState.candidates = undefined;

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });

    it('should return undefined and not decode when the program has no IDL', () => {
        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });

    it('should return undefined and not decode when there is no raw instruction (pre-parsed)', () => {
        idlState.candidates = [ANCHOR];

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw: undefined }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });
});
