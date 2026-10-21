import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';

import { toBuffer } from '@/app/shared/lib/bytes';
import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { Address } from '../common/Address';
import { Slot } from '../common/Slot';

export function ConcurrentMerkleTreeCard({ data }: { data: Uint8Array }) {
    const cmt = ConcurrentMerkleTreeAccount.fromBuffer(toBuffer(data));
    const authority = cmt.getAuthority();
    const root = cmt.getCurrentRoot();
    const seq = cmt.getCurrentSeq();
    const canopyDepth = cmt.getCanopyDepth();
    const maxBufferSize = cmt.getMaxBufferSize();
    const treeHeight = cmt.getMaxDepth();
    const creationSlot = cmt.getCreationSlot();
    const rightMostIndex = cmt.tree.rightMostPath.index;

    const rows: KeyValueRow[] = [
        { label: 'Authority', value: <Address pubkey={authority} raw /> },
        { label: 'Creation Slot', value: <Slot slot={creationSlot.toNumber()} link /> },
        { label: 'Max Depth', value: <span className="font-mono">{treeHeight}</span> },
        { label: 'Max Buffer Size', value: <span className="font-mono">{maxBufferSize}</span> },
        { label: 'Canopy Depth', value: <span className="font-mono">{canopyDepth}</span> },
        { label: 'Current Sequence Number', value: <span className="font-mono">{seq.toString()}</span> },
        { label: 'Current Root', value: <Address pubkey={new PublicKey(root)} raw /> },
        { label: 'Current Number of Leaves', value: <span className="font-mono">{rightMostIndex}</span> },
        {
            label: 'Remaining Leaves',
            value: <span className="font-mono">{Math.pow(2, treeHeight) - rightMostIndex}</span>,
        },
        { label: 'Max Possible Leaves', value: <span className="font-mono">{Math.pow(2, treeHeight)}</span> },
    ];

    return (
        <OverviewCard title="Concurrent Merkle Tree">
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
