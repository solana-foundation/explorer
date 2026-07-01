import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

const parseInstruction = vi.fn();
const rootNodeFromAnchor = vi.fn();
const programCtor = vi.fn();

vi.mock('@codama/dynamic-parsers', () => ({ parseInstruction: (...a: unknown[]) => parseInstruction(...a) }));
vi.mock('@codama/nodes-from-anchor', () => ({ rootNodeFromAnchor: (...a: unknown[]) => rootNodeFromAnchor(...a) }));
vi.mock('@entities/idl', () => ({
    formatSerdeIdl: '',
    getFormattedIdl: (_fmt: unknown, idl: unknown) => idl,
    getProvider: () => ({}),
}));
vi.mock('@coral-xyz/anchor', () => ({
    Program: class {
        constructor(...args: unknown[]) {
            programCtor(...args);
        }
    },
}));
// The anchor branch now finishes the decode via this helper (tested in its own spec); stub it so this
// spec stays focused on the routing — which `kind` the strategy selects.
vi.mock('../decode-anchor-instruction', () => ({
    decodeAnchorInstruction: () => ({
        cardTitle: '',
        decodedIxData: undefined,
        ixAccounts: undefined,
        ixDef: undefined,
        ixName: '',
        programName: '',
    }),
}));

import { decodeInstructionWithIdl, safeDecodeInstructionWithIdl } from '../decode-instruction-with-idl';

const ix = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [],
    programId: PublicKey.unique(),
});
const anchorIdl = { accounts: [], address: ix.programId.toBase58(), instructions: [{ name: 'foo' }] };
// A Codama-native root node (as a PMP IDL is) — routed through Codama, never the Anchor Program.
const codamaIdl = { kind: 'rootNode', program: { publicKey: ix.programId.toBase58() } };

describe('decodeInstructionWithIdl', () => {
    beforeEach(() => {
        parseInstruction.mockReset();
        rootNodeFromAnchor.mockReset();
        programCtor.mockReset();
    });

    it('should decode a Codama-native (rootNode) IDL through Codama', () => {
        parseInstruction.mockReturnValue({ accounts: [], path: [] });
        expect(decodeInstructionWithIdl(ix, codamaIdl, 'http://localhost').kind).toBe('codama');
    });

    it('should decode an Anchor IDL through the Anchor Program, not Codama (even when Codama could parse it)', () => {
        // Codama would succeed here, but an Anchor IDL must still take the rich Anchor path so it keeps
        // event cards + nested account groups. Codama is not consulted first.
        parseInstruction.mockReturnValue({ accounts: [], path: [] });
        expect(decodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('anchor');
        expect(parseInstruction).not.toHaveBeenCalled();
    });

    it('should fall back to Codama-from-Anchor when the Anchor Program cannot be built', () => {
        programCtor.mockImplementation(() => {
            throw new Error('bad idl');
        });
        rootNodeFromAnchor.mockReturnValue({});
        parseInstruction.mockReturnValue({ accounts: [], path: [] });
        expect(decodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('codama');
        expect(rootNodeFromAnchor).toHaveBeenCalledOnce();
    });

    it('should return unknown when the Anchor Program and the Codama fallback both fail', () => {
        programCtor.mockImplementation(() => {
            throw new Error('bad idl');
        });
        rootNodeFromAnchor.mockImplementation(() => {
            throw new Error('nope');
        });
        expect(decodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('unknown');
    });

    it('should panic and throw when the IDL program does not match the instruction program', () => {
        const panic = vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        const mismatchedIdl = { ...anchorIdl, address: PublicKey.unique().toBase58() };

        expect(() => decodeInstructionWithIdl(ix, mismatchedIdl, 'http://localhost')).toThrow('does not match');
        expect(panic).toHaveBeenCalledOnce();
        expect(parseInstruction).not.toHaveBeenCalled();
    });
});

describe('safeDecodeInstructionWithIdl', () => {
    beforeEach(() => {
        parseInstruction.mockReset();
        rootNodeFromAnchor.mockReset();
        programCtor.mockReset();
    });

    it('should degrade a program-mismatch panic to an unknown decode instead of throwing', () => {
        const panic = vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        const mismatchedIdl = { ...anchorIdl, address: PublicKey.unique().toBase58() };

        expect(safeDecodeInstructionWithIdl(ix, mismatchedIdl, 'http://localhost')).toEqual({ kind: 'unknown' });
        expect(panic).toHaveBeenCalledOnce();
    });

    it('should pass through a successful decode unchanged', () => {
        expect(safeDecodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('anchor');
    });
});
