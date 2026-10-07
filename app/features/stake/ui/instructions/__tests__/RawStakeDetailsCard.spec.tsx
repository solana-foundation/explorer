import { gen } from '@__fixtures__/gen';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { readCardRows, renderTxCard } from '@/app/__tests__/card-harness';

import { RawStakeDetailsCard } from '../RawStakeDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const STAKE_PROGRAM_ID = new PublicKey(STAKE_PROGRAM_ADDRESS);

/** Stake discriminators, as the u32 the classifier reads. */
const GET_MINIMUM_DELEGATION = 13;
const INITIALIZE = 0;
const UNRECOGNIZED = 999;

function instruction(discriminator: number, programId = STAKE_PROGRAM_ID): TransactionInstruction {
    const data = Buffer.alloc(4);
    data.writeUInt32LE(discriminator);
    return new TransactionInstruction({ data, keys: [], programId });
}

describe('stake::RawStakeDetailsCard', () => {
    it('should render the dedicated card for the Get Minimum Delegation discriminator', async () => {
        renderCard(instruction(GET_MINIMUM_DELEGATION));

        await waitFor(() => {
            expect(screen.getByText('Stake Program: Get Minimum Delegation')).toBeInTheDocument();
        });
    });

    it.each([
        { discriminator: INITIALIZE, name: 'an instruction the parsed path owns' },
        { discriminator: UNRECOGNIZED, name: 'an unrecognized discriminator' },
    ])('should fall back to Unknown for $name', async ({ discriminator }) => {
        renderCard(instruction(discriminator));

        await waitFor(() => {
            expect(screen.getByText('Stake Program: Unknown Instruction')).toBeInTheDocument();
        });
    });

    // The node this card hand-builds carries the address, so a foreign program id proves the
    // Program row reads the instruction rather than a stake-program constant.
    it('should build the Program row from the instruction', async () => {
        const foreign = gen.publicKey(1);
        renderCard(instruction(GET_MINIMUM_DELEGATION, foreign));

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', foreign.toBase58()]);
        });
    });
});

function renderCard(ix: TransactionInstruction) {
    return renderTxCard(<RawStakeDetailsCard ix={ix} index={0} result={{ err: null }} />);
}
