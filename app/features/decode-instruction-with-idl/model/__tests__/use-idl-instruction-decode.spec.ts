// @vitest-environment jsdom

import { type AnchorIdl, type CodamaIdl, type ProgramIdls } from '@entities/idl';
import { IdlVariant } from '@entities/idl/model/idl-variant';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SourcedIdlInstructionDecode, useIdlInstructionDecode } from '../use-idl-instruction-decode';

// Mock the resolution boundary and the decode helper, so the test covers only the hook's IDL choice,
// argument forwarding and gating. The SWR and decode code have their own specs. The panic→Unknown degrade
// belongs to `safeDecodeInstructionWithIdl` and is tested with the lib.
const READY: ProgramIdls['stored'] = { record: undefined, status: 'ready' };
const idlState: ProgramIdls = { idls: [], onChainIdls: [], stored: READY };
const safeDecodeInstructionWithIdl = vi.fn();
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({ useProgramIdls: (...args: unknown[]) => useProgramIdls(...args) }));
vi.mock('../../lib/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('../../lib/decode-instruction-with-idl')>()),
    safeDecodeInstructionWithIdl: (...a: unknown[]) => safeDecodeInstructionWithIdl(...a),
}));

const raw = new TransactionInstruction({ data: Buffer.from([1, 2, 3]), keys: [], programId: PublicKey.unique() });
const programId = raw.programId.toString();
const anchorIdl = { kind: 'anchor' } as unknown as AnchorIdl;
const pmpIdl = { kind: 'rootNode', standard: 'codama' } as unknown as CodamaIdl;
const customIdl = { kind: 'custom' } as unknown as CodamaIdl;
const ANCHOR = { idl: anchorIdl, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' } as const;
const PMP = { idl: pmpIdl, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' } as const;
const CUSTOM = { idl: customIdl, origin: { kind: 'pasted' }, source: 'custom', standard: 'Codama' } as const;

describe('useIdlInstructionDecode', () => {
    beforeEach(() => {
        safeDecodeInstructionWithIdl.mockReset();
        useProgramIdls.mockClear();
        idlState.idls = [];
        idlState.onChainIdls = [];
        idlState.stored = READY;
    });

    it('should decode with the PMP IDL over the IDL from the Anchor IDL account', () => {
        idlState.idls = [PMP, ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, pmpIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'codama', source: IdlVariant.ProgramMetadata });
    });

    it('should decode with the IDL from the Anchor IDL account when the program has no PMP IDL', () => {
        idlState.idls = [ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'anchor' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, anchorIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'anchor', source: IdlVariant.Anchor });
    });

    it('should return unknown, not failed, when an on-chain IDL cannot decode the instruction', () => {
        idlState.idls = [ANCHOR];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'unknown' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'unknown', source: IdlVariant.Anchor });
    });

    it('should decode with the selected custom IDL over the PMP IDL', () => {
        idlState.idls = [CUSTOM];
        idlState.onChainIdls = [PMP];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'codama' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(safeDecodeInstructionWithIdl).toHaveBeenCalledWith(raw, customIdl, 'http://localhost');
        expect(result.current).toEqual({ kind: 'codama', source: 'custom' });
    });

    it('should return failed when the custom IDL cannot decode the instruction', () => {
        idlState.idls = [CUSTOM];
        safeDecodeInstructionWithIdl.mockReturnValue({ kind: 'unknown' });

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'failed', source: 'custom' });
    });

    it('should read the IDLs of the instruction program', () => {
        renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(useProgramIdls).toHaveBeenCalledWith(programId, 'http://localhost', 'devnet');
    });

    it('should return pending and not decode while the store reads the stored selection', () => {
        idlState.idls = undefined;
        idlState.stored = { status: 'loading' };

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw }));

        expect(result.current).toEqual({ kind: 'pending' });
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });

    it('should return undefined, not pending, for a pre-parsed instruction while the store loads', () => {
        idlState.idls = undefined;
        idlState.stored = { status: 'loading' };

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw: undefined }));

        expect(result.current).toBeUndefined();
    });

    it('should return undefined and not decode while the on-chain IDLs load', () => {
        idlState.idls = undefined;

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
        idlState.idls = [ANCHOR];

        const { result } = renderHook(() => useIdlInstructionDecode({ programId, raw: undefined }));

        expect(result.current).toBeUndefined();
        expect(safeDecodeInstructionWithIdl).not.toHaveBeenCalled();
    });
});

// @ts-expect-error A custom IDL decodes strictly, so no custom decode is unknown.
const UNKNOWN_CUSTOM_DECODE: SourcedIdlInstructionDecode = { kind: 'unknown', source: 'custom' };
void UNKNOWN_CUSTOM_DECODE;
