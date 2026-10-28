import { gen } from '@__fixtures__/gen';
import { FetchStatus } from '@providers/cache';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invariant } from '@/app/shared/lib/invariant';

import type { RawInstructions } from '../model/raw-source';
import { type InstructionSurface, useInstructionSurface } from '../model/surface';
import { TxInstructionSurface } from '../ui/TxInstructionSurface';

const SIGNATURE = gen.signature(1);
const WIRE_IX = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.default });

const fetchRaw = vi.fn();
let rawDetails: { data?: { raw?: unknown }; status: FetchStatus } | undefined;

vi.mock('@providers/transactions/raw', () => ({
    useFetchRawTransaction: () => fetchRaw,
    useRawTransactionDetails: () => rawDetails,
}));

beforeEach(() => {
    vi.clearAllMocks();
    rawDetails = undefined;
});

describe('TxInstructionSurface', () => {
    it.each([
        ['before a fetch', undefined],
        ['while a fetch runs', { status: FetchStatus.Fetching }],
        ['after a failed fetch', { status: FetchStatus.FetchFailed }],
    ])('should offer a fetch of the signature %s', (_, details) => {
        rawDetails = details;

        const rawInstructions = readRawInstructions();
        invariant(rawInstructions?.status === 'fetchable', 'the surface offers a fetch');
        rawInstructions.fetch();

        expect(fetchRaw).toHaveBeenCalledWith(SIGNATURE);
    });

    it('should hold the fetched instructions', () => {
        rawDetails = { data: { raw: { transaction: { instructions: [WIRE_IX] } } }, status: FetchStatus.Fetched };

        expect(readRawInstructions()).toEqual({ instructions: [WIRE_IX], status: 'fetched' });
    });

    it('should hold no instructions for a fetched transaction that cannot be decompiled', () => {
        rawDetails = { data: { raw: { transaction: undefined } }, status: FetchStatus.Fetched };

        expect(readRawInstructions()).toEqual({ instructions: undefined, status: 'fetched' });
    });

    it('should throw outside an instruction surface', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<ReadSurface onRead={() => {}} />)).toThrow('InstructionSurfaceProvider');
        consoleError.mockRestore();
    });

    it('should reject a surface that omits the signature', () => {
        // An unused `@ts-expect-error` fails tsc, so this breaks if the key turns optional.
        // @ts-expect-error A surface states its signature, even as `undefined`.
        const surface: InstructionSurface = {
            Card: () => undefined,
            collapsible: false,
            instructionData: () => undefined,
            rawInstructions: undefined,
            result: { err: null },
            validateProgram: false,
        };

        expect(surface.signature).toBeUndefined();
    });

    it('should reject a surface that omits the raw instructions', () => {
        // @ts-expect-error A surface states its raw instructions, even as `undefined`.
        const surface: InstructionSurface = {
            Card: () => undefined,
            collapsible: false,
            instructionData: () => undefined,
            result: { err: null },
            signature: undefined,
            validateProgram: false,
        };

        expect(surface.rawInstructions).toBeUndefined();
    });
});

function readRawInstructions(): RawInstructions | undefined {
    let read: RawInstructions | undefined;
    render(
        <TxInstructionSurface
            Card={() => undefined}
            instructionData={() => undefined}
            result={{ err: null }}
            signature={SIGNATURE}
        >
            <ReadSurface onRead={surface => (read = surface.rawInstructions)} />
        </TxInstructionSurface>,
    );
    return read;
}

function ReadSurface({ onRead }: { onRead: (surface: InstructionSurface) => void }) {
    onRead(useInstructionSurface());
    return undefined;
}
