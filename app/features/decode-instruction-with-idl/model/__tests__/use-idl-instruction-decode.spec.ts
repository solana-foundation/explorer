// @vitest-environment jsdom

import { type ProgramIdls } from '@entities/idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SourcedIdlInstructionDecode, useIdlInstructionDecode } from '../use-idl-instruction-decode';

// Mock the resolution boundary + the decode helper so the test pins the hook's own job — candidate choice,
// argument forwarding, and gating — not the SWR/decode machinery (each tested in its own slice). The
// panic→Unknown degrade is `safeDecodeInstructionWithIdl`'s responsibility and is tested with the lib.
const READY: ProgramIdls['stored'] = { record: undefined, status: 'ready' };
const idlState: Pick<ProgramIdls, 'candidates' | 'stored'> = { candidates: [], stored: READY };
const safeDecodeInstructionWithIdl = vi.fn();

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({ useProgramIdls: () => idlState }));
vi.mock('../../lib/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('../../lib/decode-instruction-with-idl')>()),
    safeDecodeInstructionWithIdl: (...a: unknown[]) => safeDecodeInstructionWithIdl(...a),
}));

const raw = new TransactionInstruction({ data: Buffer.from([1, 2, 3]), keys: [], programId: PublicKey.unique() });
const programId = raw.programId.toString();
const customIdl = { kind: 'custom' } as never;
const anchorIdl = { kind: 'anchor' } as never;
const pmpIdl = { kind: 'pmp' } as never;
const CUSTOM = { idl: customIdl, origin: { kind: 'pasted' }, source: 'custom', standard: 'Codama' } as const;
const ANCHOR = { address: undefined, idl: anchorIdl, source: 'anchor', standard: 'Anchor' } as const;
const PMP = { address: undefined, idl: pmpIdl, source: 'programMetadata', standard: 'Codama' } as const;

describe('useIdlInstructionDecode', () => {
    beforeEach(() => {
        safeDecodeInstructionWithIdl.mockReset();
        idlState.candidates = [];
        idlState.stored = READY;
    });

    it('should decode with the first candidate and report its source', () => {
        idlState.candidates = [PMP, ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, pmpIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'codama', source: 'programMetadata' });
    });

    it('should decode with the selected custom IDL and report its source', () => {
        idlState.candidates = [CUSTOM];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, customIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'codama', source: 'custom' });
    });

    it('should return pending and not decode while the store reads the stored selection', () => {
        idlState.candidates = undefined;
        idlState.stored = { status: 'loading' };

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'pending' });
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });

    it('should return undefined, not pending, for a pre-parsed instruction while the store loads', () => {
        idlState.candidates = undefined;
        idlState.stored = { status: 'loading' };

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw: undefined }));

        expect(result.current).toBeUndefined();
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

    it('should return failed when the custom IDL cannot decode the instruction', () => {
        idlState.candidates = [CUSTOM];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'unknown' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'failed', source: 'custom' });
    });

    it('should return unknown, not failed, when an on-chain IDL cannot decode the instruction', () => {
        idlState.candidates = [ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'unknown' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'unknown', source: 'anchor' });
    });
});

// @ts-expect-error A custom IDL decodes strictly, so no custom decode is unknown.
const UNKNOWN_CUSTOM_DECODE: SourcedIdlInstructionDecode = { kind: 'unknown', source: 'custom' };
void UNKNOWN_CUSTOM_DECODE;
