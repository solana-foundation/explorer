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

import { decodeInstructionWithIdl } from '../decode-instruction-with-idl';

const ix = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [],
    programId: PublicKey.unique(),
});
const anchorIdl = { accounts: [], address: ix.programId.toBase58(), instructions: [{ name: 'foo' }] };

describe('decodeInstructionWithIdl', () => {
    beforeEach(() => {
        parseInstruction.mockReset();
        rootNodeFromAnchor.mockReset();
        programCtor.mockReset();
    });

    it('should return a codama decode when the Codama parser succeeds', () => {
        parseInstruction.mockReturnValue({ accounts: [], path: [] });
        expect(decodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('codama');
    });

    it('should fall back to an anchor decode when Codama cannot parse the IDL', () => {
        // Mirror the real failure: Codama throws and the anchor->codama conversion rejects the IDL.
        parseInstruction.mockImplementation(() => {
            throw new Error('not a root node');
        });
        rootNodeFromAnchor.mockImplementation(() => {
            throw new Error('Argument name [id] is missing from the instruction definition');
        });
        expect(decodeInstructionWithIdl(ix, anchorIdl, 'http://localhost').kind).toBe('anchor');
    });

    it('should return unknown when both Codama and the Anchor coder fail', () => {
        parseInstruction.mockImplementation(() => {
            throw new Error('nope');
        });
        rootNodeFromAnchor.mockImplementation(() => {
            throw new Error('nope');
        });
        programCtor.mockImplementation(() => {
            throw new Error('bad idl');
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
