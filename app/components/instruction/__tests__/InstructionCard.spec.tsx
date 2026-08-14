import { gen } from '@__fixtures__/gen';
import { FetchStatus } from '@providers/cache';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InstructionCard } from '../InstructionCard';
import { SignatureContext } from '../SignatureContext';

const SIGNATURE = gen.signature(1);
const PROGRAM_ID = new PublicKey(gen.address(1));

const fetchRaw = vi.fn();
let rawDetails: { data?: { raw?: unknown }; status: FetchStatus } | undefined;

vi.mock('@providers/transactions/raw', () => ({
    useFetchRawTransaction: () => fetchRaw,
    useRawTransactionDetails: () => rawDetails,
}));

// The real card renders a table of decoded accounts; only the Raw button's request behavior is
// under test here, so stand in a button that reports what it was handed.
vi.mock('@components/common/BaseInstructionCard', () => ({
    BaseInstructionCard: ({
        onRequestRaw,
        rawUnavailable,
    }: {
        onRequestRaw?: () => void;
        rawUnavailable?: boolean;
    }) => (
        <button
            data-can-request={onRequestRaw !== undefined}
            data-raw-unavailable={rawUnavailable === true}
            onClick={() => onRequestRaw?.()}
        >
            Raw
        </button>
    ),
}));

function renderCard(props: Partial<React.ComponentProps<typeof InstructionCard>> = {}) {
    const instruction = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });

    return render(
        <SignatureContext.Provider value={SIGNATURE}>
            <InstructionCard title="Transfer" result={{ err: null }} index={0} ix={instruction} {...props} />
        </SignatureContext.Provider>,
    );
}

function legacyRawDetails() {
    const instruction = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });

    return {
        data: { raw: { transaction: { instructions: [instruction] } } },
        status: FetchStatus.Fetched,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    rawDetails = undefined;
});

describe('InstructionCard', () => {
    it('should request raw data the first time the Raw view is opened', async () => {
        renderCard();

        await userEvent.click(screen.getByRole('button'));

        expect(fetchRaw).toHaveBeenCalledWith(SIGNATURE);
    });

    it('should stop requesting raw data once a fetch has arrived without an instruction to show', async () => {
        rawDetails = { data: { raw: { transaction: undefined } }, status: FetchStatus.Fetched };

        renderCard();
        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('button').dataset.canRequest).toBe('false');
        expect(fetchRaw).not.toHaveBeenCalled();
    });

    it('should mark raw data unavailable when a fetch has arrived without an instruction to show', () => {
        rawDetails = { data: { raw: { transaction: undefined } }, status: FetchStatus.Fetched };

        renderCard();

        expect(screen.getByRole('button').dataset.rawUnavailable).toBe('true');
    });

    it('should not mark raw data unavailable for an inner instruction, which never carries it', () => {
        rawDetails = legacyRawDetails();

        renderCard({ childIndex: 0 });

        expect(screen.getByRole('button').dataset.rawUnavailable).toBe('false');
    });

    it('should stop requesting raw data once the instruction is available', () => {
        rawDetails = legacyRawDetails();

        renderCard();

        expect(screen.getByRole('button').dataset.canRequest).toBe('false');
    });

    it('should allow a retry after a failed fetch', async () => {
        rawDetails = { status: FetchStatus.FetchFailed };

        renderCard();
        await userEvent.click(screen.getByRole('button'));

        expect(fetchRaw).toHaveBeenCalledWith(SIGNATURE);
    });

    it('should not request raw data for an instruction supplied by the inspector', () => {
        const raw = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PROGRAM_ID });

        renderCard({ raw });

        expect(screen.getByRole('button').dataset.canRequest).toBe('false');
    });

    it('should stop requesting raw data for an inner instruction once a fetch has arrived', () => {
        rawDetails = legacyRawDetails();

        renderCard({ childIndex: 0 });

        expect(screen.getByRole('button').dataset.canRequest).toBe('false');
    });
});
