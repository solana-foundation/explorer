import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIdlInstructionDecode } from '../use-idl-instruction-decode';

// Mock the resolution boundaries + the decode helper so the test pins the hook's own job — IDL precedence,
// argument forwarding, and gating — not the SWR/decode machinery (each tested in its own slice). The
// panic→Unknown degrade is `safeDecodeInstructionWithIdl`'s responsibility and is tested with the lib.
const anchorState = { idl: undefined as unknown, isLoading: false, program: null };
const pmpState = { isLoading: false, programMetadataIdl: undefined as unknown };
const safeDecodeInstructionWithIdl = vi.fn();

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({ useAnchorProgram: () => anchorState }));
vi.mock('@entities/program-metadata', () => ({ useProgramMetadataIdl: () => pmpState }));
vi.mock('../../lib/decode-instruction-with-idl', () => ({
    safeDecodeInstructionWithIdl: (...a: unknown[]) => safeDecodeInstructionWithIdl(...a),
}));

const raw = new TransactionInstruction({ data: Buffer.from([1, 2, 3]), keys: [], programId: PublicKey.unique() });
const programId = raw.programId.toString();
const anchorIdl = { kind: 'anchor' };
const pmpIdl = { kind: 'pmp' };

describe('useIdlInstructionDecode', () => {
    beforeEach(() => {
        safeDecodeInstructionWithIdl.mockReset();
        anchorState.idl = undefined;
        pmpState.programMetadataIdl = undefined;
    });

    it('should prefer the PMP IDL over the legacy Anchor IDL', () => {
        anchorState.idl = anchorIdl;
        pmpState.programMetadataIdl = pmpIdl;
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, pmpIdl, 'http://localhost');
    });

    it('should fall back to the Anchor IDL when no PMP IDL is published', () => {
        anchorState.idl = anchorIdl;
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'anchor' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, anchorIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'anchor' });
    });

    it('should return undefined and not decode when the program has no IDL', () => {
        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });

    it('should return undefined and not decode when there is no raw instruction (pre-parsed)', () => {
        anchorState.idl = anchorIdl;

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw: undefined }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });
});
