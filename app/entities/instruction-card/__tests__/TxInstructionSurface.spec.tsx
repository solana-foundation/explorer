import { gen } from '@__fixtures__/gen';
import { FetchStatus } from '@providers/cache';
import { type ParsedInstruction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import { invariant } from '@/app/shared/lib/invariant';

import { toInstructionNode } from '../model/node';
import type { RawInstructions } from '../model/raw-source';
import { type InstructionSurface, useInstructionSurface } from '../model/surface';
import { InstructionCardView } from '../ui/InstructionCardView';
import { TxInstructionSurface } from '../ui/TxInstructionSurface';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const SIGNATURE = gen.signature(1);
const WIRE_IX = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.default });
const PARSED_IX: ParsedInstruction = {
    parsed: { info: {}, type: 'transfer' },
    program: 'system',
    programId: SystemProgram.programId,
};

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

    it('should request the raw transaction when the reader clicks Raw on an RPC-parsed card', async () => {
        renderParsedCard();

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(fetchRaw).toHaveBeenCalledWith(SIGNATURE);
    });

    it('should show the accounts of the fetched instruction in the Raw view of an RPC-parsed card', async () => {
        const wireIx = new TransactionInstruction({
            data: Buffer.from([1]),
            keys: [{ isSigner: true, isWritable: true, pubkey: gen.publicKey(1) }],
            programId: SystemProgram.programId,
        });
        rawDetails = { data: { raw: { transaction: { instructions: [wireIx] } } }, status: FetchStatus.Fetched };
        renderParsedCard();

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(screen.getByText('Account #1')).toBeInTheDocument();
        expect(fetchRaw).not.toHaveBeenCalled();
    });
});

function renderParsedCard() {
    renderWithProviders(
        <TxInstructionSurface
            Card={() => undefined}
            instructionData={() => undefined}
            result={{ err: null }}
            signature={SIGNATURE}
        >
            <InstructionCardView node={toInstructionNode({ index: 0, ix: PARSED_IX })} title="System Program: Transfer">
                <tr>
                    <td>decoded</td>
                </tr>
            </InstructionCardView>
        </TxInstructionSurface>,
        { transactions: false },
    );
}

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
