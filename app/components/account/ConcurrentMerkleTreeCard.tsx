import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';

import { toBuffer } from '@/app/shared/lib/bytes';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

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
                <BaseTable.Row>
                    <BaseTable.Cell>Authority</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={authority} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Creation Slot</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Slot slot={creationSlot.toNumber()} link />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Max Depth</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{treeHeight}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Max Buffer Size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{maxBufferSize}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Canopy Depth</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{canopyDepth}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Current Sequence Number</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{seq.toString()}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Current Root</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={new PublicKey(root)} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Current Number of Leaves</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{rightMostIndex}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Remaining Leaves</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{Math.pow(2, treeHeight) - rightMostIndex}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Max Possible Leaves</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <span className="font-mono">{Math.pow(2, treeHeight)}</span>
                    </BaseTable.Cell>
                </BaseTable.Row>
            </TableCardBody>
        </Card>
    );
}
