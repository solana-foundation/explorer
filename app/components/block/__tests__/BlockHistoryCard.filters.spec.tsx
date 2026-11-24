import type { BlockData, BlockTransactionMeta } from '@entities/block-data';
import { makeBlock, makeBlockTransaction } from '@entities/block-data/__fixtures__/block-builders';
import { type Address, address, lamports, type Signature } from '@solana/kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PROGRAM_A = '11111111111111111111111111111111';
const PROGRAM_B = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ACCOUNT = 'Stake11111111111111111111111111111111111111';
let search = `version=0&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`;
let loggedComputeUnits: number | undefined = 0;
let logsTruncated = false;

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

vi.mock('@entities/program-logs', () => ({
    getLoggedComputeUnits: () => loggedComputeUnits,
    parseProgramLogs: () => ({ invocations: [], truncated: logsTruncated }),
}));

import { BlockHistoryCard } from '../BlockHistoryCard';

describe('BlockHistoryCard filters', () => {
    beforeEach(() => {
        search = `version=0&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`;
        loggedComputeUnits = 0;
        logsTruncated = false;
    });

    it('should combine version, program, and account filters while preserving URL parameters', () => {
        render(<BlockHistoryCard block={makeMixedBlock()} epoch={500n} />);

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
        render(<BlockHistoryCard block={makeMixedBlock()} epoch={500n} />);

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
        render(<BlockHistoryCard block={makeMixedBlock(false)} epoch={500n} />);
        expect(screen.getByText('No transactions found with this filter')).toBeInTheDocument();
    });

    it.each([
        ['filter=all', 2],
        ['filter=all&status=failed', 0],
        ['filter=all&status=succeeded', 0],
    ])('should show an unavailable transaction only without a status filter: %s', (query, expectedCount) => {
        search = query;
        render(<BlockHistoryCard block={makeBlockWithUnavailable()} epoch={500n} />);
        expect(screen.queryAllByText('Unavailable')).toHaveLength(expectedCount);
    });

    it('should keep the CUs Consumed column when an unavailable transaction is listed', () => {
        search = 'filter=all';
        render(<BlockHistoryCard block={makeBlockWithUnavailable()} epoch={500n} />);
        expect(screen.getAllByText('CUs Consumed').length).toBeGreaterThan(0);
    });

    it('should show the recorded compute units, not the sum of the logs', () => {
        search = 'filter=all';
        loggedComputeUnits = 276;
        render(
            <BlockHistoryCard
                block={makeBlock([makeTransaction(0, 'recorded', 0, PROGRAM_A, null, 576n)])}
                epoch={500n}
            />,
        );
        expect(screen.getAllByText('576').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('276')).toHaveLength(0);
    });

    it('should show a recorded figure with no lower-bound mark when the logs are truncated', () => {
        search = 'filter=all';
        logsTruncated = true;
        render(
            <BlockHistoryCard
                block={makeBlock([makeTransaction(0, 'recorded', 0, PROGRAM_A, null, 576n)])}
                epoch={500n}
            />,
        );
        expect(screen.getAllByText('576').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('>576')).toHaveLength(0);
    });

    it('should mark the sum of truncated logs as a lower bound', () => {
        search = 'filter=all';
        loggedComputeUnits = 276;
        logsTruncated = true;
        render(<BlockHistoryCard block={makeBlock([makeTransaction(0, 'logged', 0, PROGRAM_A)])} epoch={500n} />);
        expect(screen.getAllByText('>276').length).toBeGreaterThan(0);
    });

    it('should show Unknown for a transaction with no figure when another transaction has one', () => {
        search = 'filter=all';
        loggedComputeUnits = undefined;
        render(
            <BlockHistoryCard
                block={makeBlock([
                    makeTransaction(0, 'recorded', 0, PROGRAM_A, null, 576n),
                    makeTransaction(1, 'no-figure', 0, PROGRAM_A, { InstructionError: [0, { Custom: 1 }] }),
                ])}
                epoch={500n}
            />,
        );
        expect(screen.getAllByText('CUs Consumed').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
    });

    it('should hide the CUs Consumed column when no transaction has a figure', () => {
        search = 'filter=all&status=failed';
        loggedComputeUnits = undefined;
        render(<BlockHistoryCard block={makeMixedBlock()} epoch={500n} />);
        expect(screen.queryAllByText('CUs Consumed')).toHaveLength(0);
    });
});

function makeBlockWithUnavailable(): BlockData {
    const block = makeMixedBlock();
    return { ...block, transactions: [...block.transactions, { index: block.transactions.length, unavailable: true }] };
}

function makeMixedBlock(withFailed = true): BlockData {
    return makeBlock([
        makeTransaction(0, 'legacy-program-a', 'legacy', PROGRAM_A),
        makeTransaction(1, 'v0-program-a', 0, PROGRAM_A),
        makeTransaction(2, 'v0-program-b', 0, PROGRAM_B),
        ...(withFailed
            ? [makeTransaction(3, 'failed-program-b', 0, PROGRAM_B, { InstructionError: [0, { Custom: 1 }] })]
            : []),
    ]);
}

function makeTransaction(
    index: number,
    transactionSignature: string,
    version: 'legacy' | 0,
    program: string,
    err: BlockTransactionMeta['err'] = null,
    computeUnitsConsumed?: bigint,
) {
    return makeBlockTransaction({
        index,
        message: {
            instructions: [{ accountIndices: [1], data: new Uint8Array(), programAddressIndex: 0 }],
            staticAccounts: [address(program), address(ACCOUNT)],
            version,
        },
        meta: {
            computeUnitsConsumed,
            costUnits: 1n,
            err,
            fee: lamports(5_000n),
            innerInstructions: [],
            loadedAddresses: undefined,
        },
        signatures: [transactionSignature as Signature],
    });
}
