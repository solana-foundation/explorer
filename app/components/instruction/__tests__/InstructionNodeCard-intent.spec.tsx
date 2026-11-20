import { gen } from '@__fixtures__/gen';
import { type InstructionNode, toInstructionNode, TxInstructionSurface } from '@entities/instruction-card';
import { InstructionParserProvider } from '@entities/instruction-parser';
import { toKitInstruction } from '@explorer/parsers/compat';
import { useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { FetchStatus } from '@providers/cache';
import { type ParsedInstruction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionNodeCard } from '../InstructionNodeCard';

const SIGNATURE = gen.signature(1);
const [FROM, TO] = [gen.publicKey(1), gen.publicKey(2)];
const TRANSFER = SystemProgram.transfer({ fromPubkey: FROM, lamports: 1, toPubkey: TO });
const PARSED_TRANSFER: ParsedInstruction = {
    parsed: { info: { destination: TO.toBase58(), lamports: 1, source: FROM.toBase58() }, type: 'transfer' },
    program: 'system',
    programId: SystemProgram.programId,
};
const INNER_TRANSFER = SystemProgram.transfer({ fromPubkey: TO, lamports: 2, toPubkey: FROM });
const PARSED_INNER_TRANSFER: ParsedInstruction = {
    parsed: { info: { destination: FROM.toBase58(), lamports: 2, source: TO.toBase58() }, type: 'transfer' },
    program: 'system',
    programId: SystemProgram.programId,
};
const FETCHED_RAW = { data: { raw: { transaction: { instructions: [TRANSFER] } } }, status: FetchStatus.Fetched };

let rawDetails: { data?: { raw?: unknown }; status: FetchStatus } | undefined;
const mocks = vi.hoisted(() => ({ readRawInnerInstructions: vi.fn(), useInstructionIntent: vi.fn() }));

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));
vi.mock('@providers/transactions/raw', () => ({
    useFetchRawTransaction: () => vi.fn(),
    useRawTransactionDetails: () => rawDetails,
}));
vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    useIdlInstructionDecode: vi.fn(),
}));
vi.mock('@/app/entities/instruction-intent/model/use-instruction-intent', () => ({
    useInstructionIntent: mocks.useInstructionIntent,
}));
vi.mock('@entities/transaction-data/@x/instruction-card', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/transaction-data/@x/instruction-card')>()),
    readRawInnerInstructions: mocks.readRawInnerInstructions,
}));

beforeEach(() => {
    vi.clearAllMocks();
    rawDetails = undefined;
    mocks.readRawInnerInstructions.mockReturnValue(new Map());
    vi.mocked(useIdlInstructionDecode).mockReturnValue(undefined);
    mocks.useInstructionIntent.mockReturnValue({ reason: 'no-metadata', status: 'unavailable' });
});

describe('InstructionNodeCard intent', () => {
    it('should open the intent row when the button on a top-level card is clicked', async () => {
        renderCard(toInstructionNode({ index: 0, ix: TRANSFER }));

        await userEvent.click(screen.getByTestId('instruction-intent-trigger'));

        expect(screen.getByTestId('instruction-intent-panel')).toBeInTheDocument();
    });

    it('should show an intent button on the top-level card and on its inner card', () => {
        renderCard(withInner(toInstructionNode({ childIndex: 0, index: 0, ix: INNER_TRANSFER })));

        expect(screen.getAllByText('System Program: Transfer')).toHaveLength(2);
        expect(screen.getAllByTestId('instruction-intent-trigger')).toHaveLength(2);
    });

    it('should open only the intent row of the card whose button is clicked', async () => {
        renderCard(withInner(toInstructionNode({ childIndex: 0, index: 0, ix: INNER_TRANSFER })));

        const [, innerTrigger] = screen.getAllByTestId('instruction-intent-trigger');
        await userEvent.click(innerTrigger);

        expect(screen.getAllByTestId('instruction-intent-panel')).toHaveLength(1);
    });

    it('should build the intent of a parsed inner card from the raw inner instructions', () => {
        rawDetails = FETCHED_RAW;
        mocks.readRawInnerInstructions.mockReturnValue(new Map([[0, [INNER_TRANSFER]]]));

        renderCard(withInner(toInstructionNode({ childIndex: 0, index: 0, ix: PARSED_INNER_TRANSFER })));

        expect(fetchResults()).toContainEqual({ instruction: toKitInstruction(INNER_TRANSFER), status: 'success' });
    });

    it('should report failed for a parsed inner card whose raw inner instruction calls another program', () => {
        const otherProgramIx = new TransactionInstruction({ keys: [], programId: new PublicKey(gen.address(9)) });
        rawDetails = FETCHED_RAW;
        mocks.readRawInnerInstructions.mockReturnValue(new Map([[0, [otherProgramIx]]]));

        renderCard(withInner(toInstructionNode({ childIndex: 0, index: 0, ix: PARSED_INNER_TRANSFER })));

        expect(fetchResults()).toContainEqual({ status: 'failed' });
    });

    it('should build the intent of an unparsed card from its own instruction', () => {
        renderCard(toInstructionNode({ index: 0, ix: TRANSFER }));

        expect(lastFetchResult()).toEqual({ instruction: toKitInstruction(TRANSFER), status: 'success' });
    });

    it('should build the intent of a parsed card from the raw transaction', () => {
        rawDetails = FETCHED_RAW;

        renderCard(toInstructionNode({ index: 0, ix: PARSED_TRANSFER }));

        expect(lastFetchResult()).toEqual({ instruction: toKitInstruction(TRANSFER), status: 'success' });
    });

    it('should report loading for a parsed card before the raw transaction arrives', () => {
        renderCard(toInstructionNode({ index: 0, ix: PARSED_TRANSFER }));

        expect(lastFetchResult()).toEqual({ status: 'loading' });
    });

    it('should report failed for a parsed card when the raw fetch fails', () => {
        rawDetails = { status: FetchStatus.FetchFailed };

        renderCard(toInstructionNode({ index: 0, ix: PARSED_TRANSFER }));

        expect(lastFetchResult()).toEqual({ status: 'failed' });
    });

    it('should keep the instruction reference when the card renders again', () => {
        const node = toInstructionNode({ index: 0, ix: TRANSFER });
        const { rerender } = renderCard(node);

        rerender(routed(node));

        const [first, last] = [mocks.useInstructionIntent.mock.calls[0], mocks.useInstructionIntent.mock.lastCall];
        expect(mocks.useInstructionIntent.mock.calls.length).toBeGreaterThan(1);
        expect(last?.[0].ixFetchResult).toBe(first?.[0].ixFetchResult);
    });
});

function renderCard(node: InstructionNode) {
    return renderWithProviders(routed(node), { transactions: false });
}

function routed(node: InstructionNode) {
    return (
        <TxInstructionSurface
            Card={InstructionNodeCard}
            instructionData={() => undefined}
            result={{ err: null }}
            signature={SIGNATURE}
        >
            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                <InstructionNodeCard node={node} />
            </InstructionParserProvider>
        </TxInstructionSurface>
    );
}

function withInner(inner: InstructionNode) {
    return toInstructionNode({ children: [inner], index: 0, ix: TRANSFER });
}

function lastFetchResult() {
    return mocks.useInstructionIntent.mock.lastCall?.[0].ixFetchResult;
}

function fetchResults() {
    return mocks.useInstructionIntent.mock.calls.map(([{ ixFetchResult }]) => ixFetchResult);
}
