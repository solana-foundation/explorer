import type { BlockWithV1 } from '@entities/block-data';
import type { TransactionVersion } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const PROGRAM_A = '11111111111111111111111111111111';
const PROGRAM_B = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ACCOUNT = 'Stake11111111111111111111111111111111111111';
const search = `version=0&filter=${PROGRAM_A}&accountFilter=${ACCOUNT}&sort=index&dir=desc&cluster=devnet`;

vi.mock('next/navigation', () => ({
    usePathname: () => '/block/123',
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(search),
}));

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: 0 }),
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));

vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span>{signature}</span>,
}));

vi.mock('@components/common/SolBalance', () => ({
    SolBalance: ({ lamports }: { lamports: number }) => <span>{lamports}</span>,
}));

vi.mock('@entities/compute-unit', () => ({
    estimateRequestedComputeUnits: () => 0,
}));

vi.mock('@utils/program-logs', () => ({
    parseProgramLogs: () => [{ computeUnits: 0, truncated: false }],
}));

import { BlockHistoryCard } from '../BlockHistoryCard';

describe('BlockHistoryCard filters', () => {
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
});

function makeBlock(): BlockWithV1 {
    return {
        transactions: [
            makeTransaction('legacy-program-a', 'legacy', PROGRAM_A),
            makeTransaction('v0-program-a', 0, PROGRAM_A),
            makeTransaction('v0-program-b', 0, PROGRAM_B),
        ],
    } as unknown as BlockWithV1;
}

function makeTransaction(signature: string, version: TransactionVersion, program: string) {
    const keys = [new PublicKey(program), new PublicKey(ACCOUNT)];
    return {
        meta: {
            costUnits: 1,
            err: null,
            fee: 5_000,
            innerInstructions: [],
            loadedAddresses: undefined,
            logMessages: [],
        },
        transaction: {
            message: {
                compiledInstructions: [{ data: new Uint8Array(), programIdIndex: 0 }],
                getAccountKeys: () => ({
                    get: (index: number) => keys[index],
                    keySegments: () => [keys],
                }),
            },
            signatures: [signature],
        },
        version,
    };
}
