import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import {
    GridHeaderRow,
    LoadMoreButton,
    type ResponsiveCell,
    ResponsiveGridRow,
    TIGHT_CARD,
} from '@/app/components/block/shared';
import { Card } from '@/app/shared/ui/Card';

const PAGE_SIZE = 10;

type Reward = NonNullable<BlockWithV1['rewards']>[number];

const HEADERS = [
    { label: 'Address' },
    { label: 'Type' },
    { label: 'Amount' },
    { label: 'Post Balance' },
    { label: '% Change' },
];

// Address takes the slack (`1fr`); the numeric columns are capped so long balances can't squeeze the
// address column to nothing. Header and rows share this template so columns stay aligned. Inline (not a
// `grid-cols-[…]` class) so the Storybook JIT can't purge it.
const GRID_TEMPLATE: React.CSSProperties = {
    gridTemplateColumns: 'minmax(0,1fr) minmax(auto,4rem) minmax(auto,6.5rem) minmax(auto,8.5rem) minmax(auto,7.5rem)',
};

// Share of the pre-reward balance that this reward moved.
function percentChange(reward: Reward): string | undefined {
    if (!reward.postBalance) {
        return undefined;
    }
    const pct = (Math.abs(reward.lamports) / (reward.postBalance - reward.lamports)) * 100;
    return `${pct.toFixed(9)}%`;
}

export function BlockRewardsCard({ block }: { block: BlockWithV1 }) {
    const [displayed, setDisplayed] = React.useState(PAGE_SIZE);

    if (!block.rewards || block.rewards.length < 1) {
        return null;
    }

    const rewards = block.rewards;
    const visible = rewards.slice(0, displayed);

    return (
        <CollapsibleSection title="Block Rewards" className="">
            <Card variant="tight" className={TIGHT_CARD}>
                <div className="text-sm text-white">
                    <GridHeaderRow headers={HEADERS} style={GRID_TEMPLATE} rightAlignFrom={2} />

                    {visible.map(reward => {
                        const pct = percentChange(reward);
                        const pubkey = new PublicKey(reward.pubkey);
                        const cells: ResponsiveCell[] = [
                            {
                                children: <Address pubkey={pubkey} link />,
                                desktopClassName: 'min-w-0',
                                key: 'address',
                                label: 'Address',
                            },
                            { children: reward.rewardType, key: 'type', label: 'Type' },
                            {
                                children: <SolBalance lamports={reward.lamports} />,
                                desktopClassName: 'text-right',
                                key: 'amount',
                                label: 'Amount',
                            },
                            {
                                children: reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-',
                                desktopClassName: 'text-right',
                                key: 'postBalance',
                                label: 'Post Balance',
                            },
                            {
                                children: pct ?? '-',
                                desktopClassName: 'break-all text-right',
                                key: 'pctChange',
                                label: '% Change',
                                mobile: <span className="break-all">{pct ?? '-'}</span>,
                            },
                        ];
                        return (
                            <ResponsiveGridRow
                                key={reward.pubkey + reward.rewardType}
                                cells={cells}
                                gridStyle={GRID_TEMPLATE}
                            />
                        );
                    })}

                    {rewards.length > displayed && <LoadMoreButton onClick={() => setDisplayed(d => d + PAGE_SIZE)} />}
                </div>
            </Card>
        </CollapsibleSection>
    );
}
