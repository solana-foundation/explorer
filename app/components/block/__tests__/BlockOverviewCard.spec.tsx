import type { BlockTransaction } from '@entities/block-data';
import { makeBlock, makeBlockTransaction } from '@entities/block-data/__fixtures__/block-builders';
import { address, lamports, type Signature } from '@solana/kit';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: 0 }),
}));

import { BlockOverviewCard } from '../BlockOverviewCard';

const COMPUTE_ROWS = ['Total CUs Consumed', 'Transaction Cost Utilization', 'Reserved Compute Units'];

describe('BlockOverviewCard', () => {
    it.each(COMPUTE_ROWS)('should mark %s as incomplete when a transaction is unavailable', label => {
        render(
            <BlockOverviewCard
                block={makeBlock([makeTransaction(), { index: 1, unavailable: true }])}
                slot={123}
                epoch={500n}
            />,
        );
        expect(rowOf(label)).toHaveTextContent('(incomplete)');
    });

    it.each(COMPUTE_ROWS)('should not mark %s as incomplete when every transaction is readable', label => {
        render(<BlockOverviewCard block={makeBlock([makeTransaction()])} slot={123} epoch={500n} />);
        expect(rowOf(label)).not.toHaveTextContent('(incomplete)');
    });
});

function rowOf(label: string): HTMLElement {
    return screen.getByText(
        (_, element) => element?.textContent?.startsWith(label) === true && element.textContent !== label,
    );
}

function makeTransaction(): BlockTransaction {
    return makeBlockTransaction({
        message: {
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            instructions: [{ accountIndices: [0], data: new Uint8Array(), programAddressIndex: 1 }],
            staticAccounts: [
                address('Stake11111111111111111111111111111111111111'),
                address('11111111111111111111111111111111'),
            ],
            version: 0,
        },
        meta: {
            computeUnitsConsumed: 150n,
            costUnits: 1_500n,
            fee: lamports(5_000n),
            innerInstructions: [],
        },
        signatures: ['signature' as Signature],
    });
}
