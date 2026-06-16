import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { Badge } from '@shared/ui/badge';
import { ConcurrentMerkleTreeAccount, MerkleTree } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import { useCluster } from '@/app/providers/cluster';
import {
    CompressedNft,
    CompressedNftProof,
    useCompressedNft,
    useCompressedNftProof,
} from '@/app/providers/compressed-nft';
import { toBuffer } from '@/app/shared/lib/bytes';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { Address } from '../common/Address';
import { TableCardBody } from '../common/TableCardBody';

export function CompressedNFTInfoCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: account?.pubkey.toString() ?? '', url });
    const proof = useCompressedNftProof({ address: account?.pubkey.toString() ?? '', url });

    if (compressedNft && compressedNft.compression.compressed && proof) {
        return <DasCompressionInfoCard proof={proof} compressedNft={compressedNft} />;
    }
    return onNotFound();
}

export function DasCompressionInfoCard({
    proof,
    compressedNft,
}: {
    proof: CompressedNftProof;
    compressedNft: CompressedNft;
}) {
    const compressedInfo = compressedNft.compression;
    const fetchAccountInfo = useFetchAccountInfo();
    const treeAccountInfo = useAccountInfo(compressedInfo.tree);
    const treeAddress = new PublicKey(compressedInfo.tree);

    React.useEffect(() => {
        fetchAccountInfo(treeAddress, 'raw');
    }, [compressedInfo.tree]); // eslint-disable-line react-hooks/exhaustive-deps

    const root = new PublicKey(proof.root);
    const proofVerified = MerkleTree.verify(root.toBuffer(), {
        leaf: new PublicKey(compressedNft.compression.asset_hash).toBuffer(),
        leafIndex: compressedNft.compression.leaf_id,
        proof: proof.proof.map(proofData => new PublicKey(proofData).toBuffer()),
        root: root.toBuffer(),
    });
    const canopyDepth =
        treeAccountInfo && treeAccountInfo.data && treeAccountInfo.data.data.raw
            ? ConcurrentMerkleTreeAccount.fromBuffer(toBuffer(treeAccountInfo.data.data.raw)).getCanopyDepth()
            : 0;
    const proofSize = proof.proof.length - canopyDepth;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Compression Info
                </CardTitle>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Concurrent Merkle Tree</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Address pubkey={treeAddress} alignRight link raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Current Tree Root {getVerifiedProofPill(proofVerified)}</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Address pubkey={root} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Proof Size {getProofSizePill(proofSize)}</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{proofSize}</BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Leaf Number</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{compressedInfo.leaf_id}</BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Sequence Number of Last Update</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{compressedInfo.seq}</BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Compressed Nft Hash</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Address pubkey={new PublicKey(compressedInfo.asset_hash)} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Creators Hash</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Address pubkey={new PublicKey(compressedInfo.creator_hash)} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Metadata Hash</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Address pubkey={new PublicKey(compressedInfo.data_hash)} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
            </TableCardBody>
        </Card>
    );
}

function getVerifiedProofPill(verified: boolean) {
    return (
        <div className="ml-1.5 inline-flex items-center">
            {verified ? (
                <Badge ui="dashkit" variant="dark" tone="solid">
                    Proof Verified
                </Badge>
            ) : (
                <Badge ui="dashkit" variant="danger">
                    Proof Not Verified
                </Badge>
            )}
        </div>
    );
}

function getProofSizePill(proofSize: number) {
    if (proofSize === 0) {
        return (
            <div className="ml-1.5 inline-flex items-center">
                <Badge ui="dashkit" variant="dark" tone="solid">
                    No Proof Required
                </Badge>
            </div>
        );
    }
    if (proofSize > 8) {
        return (
            <div className="ml-1.5 inline-flex items-center">
                <Badge ui="dashkit" variant="danger">
                    Composability Hazard
                </Badge>
            </div>
        );
    }
    return <div />;
}
