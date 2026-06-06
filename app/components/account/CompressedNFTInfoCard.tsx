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
                <tr>
                    <td>Concurrent Merkle Tree</td>
                    <td>
                        <Address pubkey={treeAddress} alignRight link raw />
                    </td>
                </tr>
                <tr>
                    <td>Current Tree Root {getVerifiedProofPill(proofVerified)}</td>
                    <td>
                        <Address pubkey={root} alignRight raw />
                    </td>
                </tr>
                <tr>
                    <td>Proof Size {getProofSizePill(proofSize)}</td>
                    <td className="e-text-right">{proofSize}</td>
                </tr>
                <tr>
                    <td>Leaf Number</td>
                    <td className="e-text-right">{compressedInfo.leaf_id}</td>
                </tr>
                <tr>
                    <td>Sequence Number of Last Update</td>
                    <td className="e-text-right">{compressedInfo.seq}</td>
                </tr>
                <tr>
                    <td>Compressed Nft Hash</td>
                    <td>
                        <Address pubkey={new PublicKey(compressedInfo.asset_hash)} alignRight raw />
                    </td>
                </tr>
                <tr>
                    <td>Creators Hash</td>
                    <td>
                        <Address pubkey={new PublicKey(compressedInfo.creator_hash)} alignRight raw />
                    </td>
                </tr>
                <tr>
                    <td>Metadata Hash</td>
                    <td>
                        <Address pubkey={new PublicKey(compressedInfo.data_hash)} alignRight raw />
                    </td>
                </tr>
            </TableCardBody>
        </Card>
    );
}

function getVerifiedProofPill(verified: boolean) {
    return (
        <div className="e-ml-1.5 e-inline-flex e-items-center">
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
            <div className="e-ml-1.5 e-inline-flex e-items-center">
                <Badge ui="dashkit" variant="dark" tone="solid">
                    No Proof Required
                </Badge>
            </div>
        );
    }
    if (proofSize > 8) {
        return (
            <div className="e-ml-1.5 e-inline-flex e-items-center">
                <Badge ui="dashkit" variant="danger">
                    Composability Hazard
                </Badge>
            </div>
        );
    }
    return <div />;
}
