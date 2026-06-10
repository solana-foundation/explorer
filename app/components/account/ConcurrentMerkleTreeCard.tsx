import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';

import { toBuffer } from '@/app/shared/lib/bytes';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { Address } from '../common/Address';
import { Slot } from '../common/Slot';
import { TableCardBody } from '../common/TableCardBody';

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
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Concurrent Merkle Tree
                </CardTitle>
            </CardHeader>

            <TableCardBody>
                <tr>
                    <td>Authority</td>
                    <td className="e-text-right">
                        <Address pubkey={authority} alignRight raw />
                    </td>
                </tr>
                <tr>
                    <td>Creation Slot</td>
                    <td className="e-text-right">
                        <Slot slot={creationSlot.toNumber()} link />
                    </td>
                </tr>
                <tr>
                    <td>Max Depth</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{treeHeight}</span>
                    </td>
                </tr>
                <tr>
                    <td>Max Buffer Size</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{maxBufferSize}</span>
                    </td>
                </tr>
                <tr>
                    <td>Canopy Depth</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{canopyDepth}</span>
                    </td>
                </tr>
                <tr>
                    <td>Current Sequence Number</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{seq.toString()}</span>
                    </td>
                </tr>
                <tr>
                    <td>Current Root</td>
                    <td className="e-text-right">
                        <Address pubkey={new PublicKey(root)} alignRight raw />
                    </td>
                </tr>
                <tr>
                    <td>Current Number of Leaves</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{rightMostIndex}</span>
                    </td>
                </tr>
                <tr>
                    <td>Remaining Leaves</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{Math.pow(2, treeHeight) - rightMostIndex}</span>
                    </td>
                </tr>
                <tr>
                    <td>Max Possible Leaves</td>
                    <td className="e-text-right">
                        <span className="e-font-mono">{Math.pow(2, treeHeight)}</span>
                    </td>
                </tr>
            </TableCardBody>
        </Card>
    );
}
