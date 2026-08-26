import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import { GridHeaderRow, LabeledField, LoadMoreButton, TIGHT_CARD } from '@/app/components/block/shared';
import { CollapsibleSection } from '@/app/features/transaction/ui/CollapsibleSection';
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
                        return (
                            <div
                                key={reward.pubkey + reward.rewardType}
                                className="border-b border-solid border-white/10 last:border-b-0"
                            >
                                <div className="flex flex-col gap-1 px-3 py-3 md:hidden md:px-4">
                                    <LabeledField label="Address">
                                        <Address pubkey={pubkey} link />
                                    </LabeledField>
                                    <LabeledField label="Type">{reward.rewardType}</LabeledField>
                                    <LabeledField label="Amount">
                                        <SolBalance lamports={reward.lamports} />
                                    </LabeledField>
                                    <LabeledField label="Post Balance">
                                        {reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}
                                    </LabeledField>
                                    <LabeledField label="% Change">
                                        <span className="break-all">{pct ?? '-'}</span>
                                    </LabeledField>
                                </div>

                                <div
                                    style={GRID_TEMPLATE}
                                    className="hidden items-start gap-5 px-3 py-2.5 md:grid md:px-4"
                                >
                                    <div className="min-w-0">
                                        <Address pubkey={pubkey} link />
                                    </div>
                                    <div>{reward.rewardType}</div>
                                    <div className="text-right">
                                        <SolBalance lamports={reward.lamports} />
                                    </div>
                                    <div className="text-right">
                                        {reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}
                                    </div>
                                    <div className="break-all text-right">{pct ?? '-'}</div>
                                </div>
                            </div>
                        );
                    })}

                    {rewards.length > displayed && <LoadMoreButton onClick={() => setDisplayed(d => d + PAGE_SIZE)} />}
                </div>
            </Card>
        </CollapsibleSection>
    );
}
