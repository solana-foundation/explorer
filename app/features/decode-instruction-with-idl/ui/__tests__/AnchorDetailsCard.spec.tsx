import { gen } from '@__fixtures__/gen';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { TxInstructionSurface } from '@entities/instruction-card';
import type { TransactionWithMeta } from '@entities/transaction-data';
import { FetchStatus } from '@providers/cache';
import { useTransactionDetails } from '@providers/transactions';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import anchor030Devi from '@/app/entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { ClusterProvider } from '@/app/providers/cluster';
import { TransactionsProvider } from '@/app/providers/transactions';

import { decodeAnchorInstruction } from '../../lib/decode-anchor-instruction';
import { AnchorDetailsCard } from '../AnchorDetailsCard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

vi.mock('@providers/transactions', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/transactions')>();
    return { ...actual, useTransactionDetails: vi.fn(actual.useTransactionDetails) };
});

const program = new Program(
    anchor030Devi as Idl,
    {
        connection: { commitment: 'confirmed', rpcEndpoint: 'https://api.devnet.solana.com' },
        opts: {},
        wallet: { publicKey: PublicKey.default },
    } as unknown as AnchorProvider,
);

const UPDATE_REWARD_INFOS_DISCRIMINATOR = [163, 172, 224, 52, 11, 154, 106, 223];
const CONFIG_CHANGE_EVENT_DISCRIMINATOR = [247, 189, 7, 119, 106, 112, 95, 151];
const CONFIG_CHANGE_EVENT = Buffer.from([...CONFIG_CHANGE_EVENT_DISCRIMINATOR, ...new Array(80).fill(0)]).toString(
    'base64',
);
const UNDECODABLE_EVENT = Buffer.from(new Array(12).fill(9)).toString('base64');
const SIGNATURE = gen.signature(1);

describe('AnchorDetailsCard', () => {
    afterEach(() => {
        vi.mocked(useTransactionDetails).mockReset();
    });

    it('should show the events that a top-level instruction logged on the card of that instruction', () => {
        const other = gen.publicKey(2);
        mockTransactionLogs(
            [
                `Program ${other} invoke [1]`,
                `Program ${other} success`,
                `Program ${program.programId} invoke [1]`,
                'Program data: AQIDBA==',
                `Program ${program.programId} success`,
            ],
            [other, program.programId],
        );

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { index: 1 });

        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Unknown Event')).toBeInTheDocument();
        expect(screen.getByText('#2 · event 1')).toBeInTheDocument();
    });

    it('should show the events that a CPI child logged on the card of that child', () => {
        const parent = gen.publicKey(2);
        mockTransactionLogs(
            [
                `Program ${parent} invoke [1]`,
                'Program data: AQIDBA==',
                `Program ${program.programId} invoke [2]`,
                `Program data: ${CONFIG_CHANGE_EVENT}`,
                `Program ${program.programId} success`,
                `Program ${parent} success`,
            ],
            [parent],
        );

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { childIndex: 0 });

        expect(screen.getByText('Config Change Event')).toBeInTheDocument();
        expect(screen.queryByText('Unknown Event')).not.toBeInTheDocument();
    });

    it('should number the event badge of a CPI child with its child index', () => {
        const parent = gen.publicKey(2);
        mockTransactionLogs(
            [
                `Program ${parent} invoke [1]`,
                `Program ${program.programId} invoke [2]`,
                `Program data: ${CONFIG_CHANGE_EVENT}`,
                `Program ${program.programId} success`,
                `Program ${parent} success`,
            ],
            [parent],
        );

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { childIndex: 0 });

        expect(screen.getByText('#1.1 · event 1')).toBeInTheDocument();
    });

    it('should not show the events of a CPI child on the card of its top-level instruction', () => {
        const child = gen.publicKey(2);
        mockTransactionLogs(
            [
                `Program ${program.programId} invoke [1]`,
                `Program ${child} invoke [2]`,
                'Program data: AQIDBA==',
                `Program ${child} success`,
                `Program ${program.programId} success`,
            ],
            [program.programId],
        );

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), {});

        expect(screen.getByText('Amm V3: Update Reward Infos')).toBeInTheDocument();
        expect(screen.queryByText('Events')).not.toBeInTheDocument();
    });

    it('should not show the Events section when the only payload is a Program log line that does not decode', () => {
        mockTransactionLogs(
            [
                `Program ${program.programId} invoke [1]`,
                `Program log: ${UNDECODABLE_EVENT}`,
                `Program ${program.programId} success`,
            ],
            [program.programId],
        );

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), {});

        expect(screen.getByText('Amm V3: Update Reward Infos')).toBeInTheDocument();
        expect(screen.queryByText('Events')).not.toBeInTheDocument();
    });
});

function makeIx(data: number[]) {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: [{ isSigner: false, isWritable: true, pubkey: gen.publicKey(1) }],
        programId: program.programId,
    });
}

function mockTransactionLogs(logMessages: string[], programIds: PublicKey[]) {
    const transactionWithMeta = {
        meta: { logMessages },
        transaction: { message: { instructions: programIds.map(programId => ({ programId })) } },
    } as unknown as TransactionWithMeta;
    vi.mocked(useTransactionDetails).mockImplementation(signature =>
        signature === SIGNATURE ? { data: { transactionWithMeta }, status: FetchStatus.Fetched } : undefined,
    );
}

function renderCard(ix: TransactionInstruction, { index = 0, childIndex }: { index?: number; childIndex?: number }) {
    return render(
        <ClusterProvider>
            <TransactionsProvider>
                <TxInstructionSurface result={{ err: null }} signature={SIGNATURE}>
                    <AnchorDetailsCard
                        ix={ix}
                        index={index}
                        childIndex={childIndex}
                        result={{ err: null }}
                        signature={SIGNATURE}
                        program={program}
                        decoded={decodeAnchorInstruction(program, ix)}
                    />
                </TxInstructionSurface>
            </TransactionsProvider>
        </ClusterProvider>,
    );
}
