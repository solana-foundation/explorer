import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockHistoryCard } from '../BlockHistoryCard';

// Real block decoding requires a fully-formed BlockWithV1 with compiled instructions,
// account keys, and meta — heavy fixture work. Empty-transactions case exercises the
// "no transactions" ErrorCard fallback and is the natural prop-driven story for this card.
const emptyBlock = {
    blockTime: null,
    blockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    parentSlot: 0,
    previousBlockhash: 'GnPnX9Y6w6vYi3iWQGfh',
    transactions: [],
} as unknown as BlockWithV1;

// Programs the synthetic transactions invoke. Deliberately excludes the Compute Budget program so
// `estimateRequestedComputeUnits` never tries to parse the (empty) instruction data — it just adds the
// per-program reserved units, which is enough to populate the "Reserved CUs" column. Vote is last so it
// can be added only as a *secondary* program (never alone) — otherwise the card's default "All Except
// Votes" filter would hide those rows and the counts would look off.
const PROGRAM_IDS = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'Stake11111111111111111111111111111111111111',
    'Vote111111111111111111111111111111111111111',
];
const VOTE_INDEX = 3;

// Distinct placeholder signature per row — the Signature cell only truncates for display, it doesn't
// base58-decode, so these render as `Sig0…0000` style links.
const signatureFor = (i: number) => `Sig${i}HistoryCardStoryPlaceholderSignatureForStorybookRendering0000000000000${i}`;

// Standard-shaped program logs so `parseProgramLogs` can extract compute units. Each invocation emits the
// runtime's invoke / consumed / success triplet; the consumed amount varies per program and position so
// per-row Compute totals differ. A failed tx ends its last instruction with an error line instead of
// success. Only when *every* rendered tx yields compute units does the optional Compute column appear.
function logsForTx(programIdxs: number[], failed: boolean): string[] {
    const logs: string[] = [];
    programIdxs.forEach((idx, n) => {
        const id = PROGRAM_IDS[idx];
        const consumed = 450 + (((idx + 1) * (n + 1) * 175) % 4_000);
        const isLast = n === programIdxs.length - 1;
        logs.push(`Program ${id} invoke [1]`);
        logs.push(`Program ${id} consumed ${consumed} of 200000 compute units`);
        logs.push(failed && isLast ? `Program ${id} failed: custom program error: 0x1` : `Program ${id} success`);
    });
    return logs;
}

// Minimal stand-in for a VersionedBlockResponse — only the shape BlockHistoryCard reads. Every 4th tx
// fails; each invokes a rotating primary program, and every 3rd also invokes a second one, so the
// filter dropdown and the "Invoked Programs" column show a realistic spread. Each tx also carries program
// logs so the optional Compute column (its data comes from parsed program logs) is populated.
function makeBlock(txCount: number): BlockWithV1 {
    const keys = PROGRAM_IDS.map(id => new PublicKey(id));
    const accountKeys = {
        get: (i: number) => keys[i],
        keySegments: () => [keys],
        length: keys.length,
    };
    const transactions = Array.from({ length: txCount }, (_, k) => {
        const failed = k % 4 === 0;
        // Primary rotates over the non-vote programs and is invoked a varying number of times (1..12) so
        // the "N ×" counter exercises single- and double-digit widths; every other tx also invokes Vote
        // once as a secondary.
        const primary = k % VOTE_INDEX;
        const primaryCount = 1 + (k % 12);
        const programIdxs = [
            ...Array.from({ length: primaryCount }, () => primary),
            ...(k % 2 === 0 ? [VOTE_INDEX] : []),
        ];
        return {
            meta: {
                costUnits: 1_000 + (k % 7) * 350,
                err: failed ? { InstructionError: [0, 'Custom'] } : null,
                fee: 5_000,
                innerInstructions: [],
                logMessages: logsForTx(programIdxs, failed),
            },
            transaction: {
                message: {
                    compiledInstructions: programIdxs.map(idx => ({ data: new Uint8Array(), programIdIndex: idx })),
                    getAccountKeys: () => accountKeys,
                    staticAccountKeys: keys,
                },
                signatures: [signatureFor(k)],
            },
        };
    });
    return { transactions } as unknown as BlockWithV1;
}

const meta = {
    component: BlockHistoryCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockHistoryCard',
} satisfies Meta<typeof BlockHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A handful of transactions — a mix of Success / Failed rows and invoked programs.
export const WithTransactions: Story = {
    args: { block: makeBlock(8), epoch: 500n },
};

// More than one page (PAGE_SIZE = 25) so the "Load More" footer shows.
export const ManyTransactions: Story = {
    args: { block: makeBlock(30), epoch: 500n },
};

// No transactions → the "This block has no transactions" ErrorCard fallback.
export const EmptyBlock: Story = {
    args: { block: emptyBlock, epoch: 500n },
};
