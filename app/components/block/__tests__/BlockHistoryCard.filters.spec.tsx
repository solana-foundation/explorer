import type { BlockData, BlockTransaction, BlockTransactionMeta } from '@entities/block-data';
import { type Address, address, blockhash, lamports, type Signature } from '@solana/kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PROGRAM_A = '11111111111111111111111111111111';
const PROGRAM_B = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ACCOUNT = 'Stake11111111111111111111111111111111111111';
let search = `version=0&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`;

vi.mock('next/navigation', () => ({
    usePathname: () => '/block/123',
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(search),
}));

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: 0 }),
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ address }: { address: Address }) => <span>{address}</span>,
}));

vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span>{signature}</span>,
}));

vi.mock('@components/common/SolBalance', () => ({
    SolBalance: ({ lamports }: { lamports: bigint }) => <span>{lamports.toString()}</span>,
}));

vi.mock('@entities/compute-unit', () => ({
    estimateRequestedComputeUnits: () => 0,
}));

vi.mock('@utils/program-logs', () => ({
    parseProgramLogs: () => [{ computeUnits: 0, truncated: false }],
}));

import { BlockHistoryCard } from '../BlockHistoryCard';

describe('BlockHistoryCard filters', () => {
    beforeEach(() => {
        search = `version=0&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`;
    });

    it('should combine version, program, and account filters while preserving URL parameters', () => {
        render(<BlockHistoryCard block={makeBlock()} epoch={500n} />);

        expect(screen.getAllByText('v0-program-a')).toHaveLength(2);
        expect(screen.queryAllByText('legacy-program-a')).toHaveLength(0);
        expect(screen.queryAllByText('v0-program-b')).toHaveLength(0);

        expect(screen.getByRole('link', { name: 'Clear version filter' })).toHaveAttribute(
            'href',
            `/block/123?filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`,
        );
        expect(screen.getByRole('link', { name: 'Clear program filter' })).toHaveAttribute(
            'href',
            `/block/123?version=0&filter=all&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
        expect(screen.getByRole('link', { name: 'v1 (0)' })).toHaveAttribute(
            'href',
            `/block/123?version=1&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`,
        );
    });

    it('should hide failed transactions when status=succeeded and offer a chip to clear it', () => {
        search = `filter=all&status=succeeded&cluster=devnet`;
        render(<BlockHistoryCard block={makeBlock()} epoch={500n} />);

        expect(screen.getAllByText('v0-program-a')).toHaveLength(2);
        expect(screen.queryAllByText('failed-program-b')).toHaveLength(0);
        expect(screen.getByText('3 filtered records')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Clear status filter' })).toHaveAttribute(
            'href',
            '/block/123?filter=all&cluster=devnet',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
        expect(screen.getByRole('link', { name: 'Failed' })).toHaveAttribute(
            'href',
            '/block/123?filter=all&status=failed&cluster=devnet',
        );
    });

    it('should show the generic empty message when a status filter matches nothing', () => {
        search = 'status=failed';
        render(<BlockHistoryCard block={makeBlock(false)} epoch={500n} />);
        expect(screen.getByText('No transactions found with this filter')).toBeInTheDocument();
    });

    it.each([
        ['filter=all', 2],
        ['filter=all&status=failed', 0],
        ['filter=all&status=succeeded', 0],
    ])('should show an unavailable transaction only without a status filter: %s', (query, expectedCount) => {
        search = query;
        const block = makeBlock();
        render(
            <BlockHistoryCard
                block={{ ...block, transactions: [...block.transactions, { index: 4, unavailable: true }] }}
                epoch={500n}
            />,
        );
        expect(screen.queryAllByText('Unavailable')).toHaveLength(expectedCount);
    });
});

function makeBlock(withFailed = true): BlockData {
    return {
        blockTime: null,
        blockhash: blockhash('11111111111111111111111111111111'),
        parentSlot: 122n,
        previousBlockhash: blockhash('11111111111111111111111111111111'),
        rewards: [],
        transactions: [
            makeTransaction(0, 'legacy-program-a', 'legacy', PROGRAM_A),
            makeTransaction(1, 'v0-program-a', 0, PROGRAM_A),
            makeTransaction(2, 'v0-program-b', 0, PROGRAM_B),
            ...(withFailed
                ? [makeTransaction(3, 'failed-program-b', 0, PROGRAM_B, { InstructionError: [0, { Custom: 1 }] })]
                : []),
        ],
    };
}

function makeTransaction(
    index: number,
    transactionSignature: string,
    version: 'legacy' | 0,
    program: string,
    err: BlockTransactionMeta['err'] = null,
) {
    return {
        index,
        message: {
            header: { numReadonlyNonSignerAccounts: 0, numReadonlySignerAccounts: 0, numSignerAccounts: 0 },
            instructions: [{ accountIndices: [1], data: new Uint8Array(), programAddressIndex: 0 }],
            lifetimeToken: blockhash('11111111111111111111111111111111'),
            staticAccounts: [address(program), address(ACCOUNT)],
            version,
        },
        meta: {
            costUnits: 1n,
            err,
            fee: lamports(5_000n),
            innerInstructions: [],
            loadedAddresses: undefined,
            logMessages: [],
        },
        signatures: [transactionSignature as Signature],
    } satisfies BlockTransaction;
}
