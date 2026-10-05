import type { BlockData, BlockTransaction } from '@entities/block-data';
import { address, blockhash, lamports, type Signature } from '@solana/kit';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: 0 }),
}));

import { BlockOverviewCard } from '../BlockOverviewCard';

const COMPUTE_ROWS = ['Total CUs Consumed', 'Transaction Cost Utilization', 'Reserved Compute Units'];

describe('BlockOverviewCard', () => {
    it.each(COMPUTE_ROWS)('should mark %s as incomplete when a transaction is unavailable', label => {
        render(<BlockOverviewCard block={makeBlock({ withUnavailable: true })} slot={123} epoch={500n} />);
        expect(rowOf(label)).toHaveTextContent('(incomplete)');
    });

    it.each(COMPUTE_ROWS)('should not mark %s as incomplete when every transaction is readable', label => {
        render(<BlockOverviewCard block={makeBlock({ withUnavailable: false })} slot={123} epoch={500n} />);
        expect(rowOf(label)).not.toHaveTextContent('(incomplete)');
    });
});

function rowOf(label: string): HTMLElement {
    return screen.getByText(
        (_, element) => element?.textContent?.startsWith(label) === true && element.textContent !== label,
    );
}

function makeBlock({ withUnavailable }: { withUnavailable: boolean }): BlockData {
    return {
        blockTime: null,
        blockhash: blockhash('11111111111111111111111111111111'),
        parentSlot: 122n,
        previousBlockhash: blockhash('11111111111111111111111111111111'),
        rewards: [],
        transactions: withUnavailable ? [makeTransaction(), { index: 1, unavailable: true }] : [makeTransaction()],
    };
}

function makeTransaction(): BlockTransaction {
    return {
        index: 0,
        message: {
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            instructions: [{ accountIndices: [0], data: new Uint8Array(), programAddressIndex: 1 }],
            lifetimeToken: blockhash('11111111111111111111111111111111'),
            staticAccounts: [
                address('Stake11111111111111111111111111111111111111'),
                address('11111111111111111111111111111111'),
            ],
            version: 0,
        },
        meta: {
            computeUnitsConsumed: 150n,
            costUnits: 1_500n,
            err: null,
            fee: lamports(5_000n),
            innerInstructions: [],
            logMessages: [],
        },
        signatures: ['signature' as Signature],
    };
}
