import { gen } from '@__fixtures__/gen';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { InstructionSurfaceProvider, toInstructionNode, TxInstructionSurface } from '@entities/instruction-card';
import type { TransactionWithMeta } from '@entities/transaction-data';
import { FetchStatus } from '@providers/cache';
import { useTransactionDetails } from '@providers/transactions';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { INSPECTOR_SURFACE } from '@/app/components/inspector/inspector-surface';
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

    it.each([
        ['tx page', 0],
        ['inspector', 1],
    ] as const)('should draw the frame of the %s', (surface, collapseButtons) => {
        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { surface });

        expect(screen.getByText('Amm V3: Update Reward Infos')).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { name: 'Collapse' })).toHaveLength(collapseButtons);
    });

    it.each(['tx page', 'inspector'] as const)(
        'should draw one Program row on the %s when the instruction decodes',
        surface => {
            renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { surface });

            expect(screen.getByText('Account Name')).toBeInTheDocument();
            expect(screen.getAllByText('Program')).toHaveLength(1);
            expectProgramLink();
        },
    );

    it.each(['tx page', 'inspector'] as const)(
        'should draw one Program row on the %s when the instruction does not decode',
        surface => {
            renderCard(makeIx([0, 0, 0, 0, 0, 0, 0, 0]), { surface });

            expect(
                screen.getByText('Failed to decode account data according to the public Anchor interface'),
            ).toBeInTheDocument();
            expect(screen.getAllByText('Program')).toHaveLength(1);
            expectProgramLink();
        },
    );

    it.each(['tx page', 'inspector'] as const)(
        'should pass the child index and the inner cards to the frame of the %s',
        surface => {
            renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), {
                childIndex: 2,
                innerCards: [<div key="inner">Inner card</div>],
                surface,
            });

            expect(screen.getByText('#1.3')).toBeInTheDocument();
            expect(screen.getByText('Inner card')).toBeInTheDocument();
        },
    );

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

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { index: 1, surface: 'tx page' });

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

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { childIndex: 0, surface: 'tx page' });

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

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { childIndex: 0, surface: 'tx page' });

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

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { surface: 'tx page' });

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

        renderCard(makeIx(UPDATE_REWARD_INFOS_DISCRIMINATOR), { surface: 'tx page' });

        expect(screen.getByText('Amm V3: Update Reward Infos')).toBeInTheDocument();
        expect(screen.queryByText('Events')).not.toBeInTheDocument();
    });
});

function expectProgramLink() {
    expect(screen.getByRole('link', { name: 'AmmV3' })).toHaveAttribute(
        'href',
        `/address/${program.programId.toBase58()}`,
    );
}

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

const SURFACES = {
    inspector: ({ children }: { children: React.ReactNode }) => (
        <InstructionSurfaceProvider surface={INSPECTOR_SURFACE}>{children}</InstructionSurfaceProvider>
    ),
    'tx page': ({ children }: { children: React.ReactNode }) => (
        <TxInstructionSurface result={{ err: null }} signature={SIGNATURE}>
            {children}
        </TxInstructionSurface>
    ),
};

function renderCard(
    ix: TransactionInstruction,
    {
        surface,
        index = 0,
        childIndex,
        innerCards,
    }: { surface: keyof typeof SURFACES; index?: number; childIndex?: number; innerCards?: JSX.Element[] },
) {
    const Surface = SURFACES[surface];

    return render(
        <ClusterProvider>
            <TransactionsProvider>
                <Surface>
                    <AnchorDetailsCard
                        node={toInstructionNode({ childIndex, index, innerCards, ix })}
                        ix={ix}
                        program={program}
                        decoded={decodeAnchorInstruction(program, ix)}
                    />
                </Surface>
            </TransactionsProvider>
        </ClusterProvider>,
    );
}
