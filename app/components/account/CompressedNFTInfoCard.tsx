import { Badge } from '@components/shared/ui/badge';
import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
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
import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { Address } from '../common/Address';

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

    const rows: KeyValueRow[] = [
        { label: 'Concurrent Merkle Tree', value: <Address pubkey={treeAddress} link raw /> },
        {
            label: <>Current Tree Root {getVerifiedProofPill(proofVerified)}</>,
            value: <Address pubkey={root} raw />,
        },
        { label: <>Proof Size {getProofSizePill(proofSize)}</>, value: proofSize },
        { label: 'Leaf Number', value: compressedInfo.leaf_id },
        { label: 'Sequence Number of Last Update', value: compressedInfo.seq },
        { label: 'Compressed Nft Hash', value: <Address pubkey={new PublicKey(compressedInfo.asset_hash)} raw /> },
        { label: 'Creators Hash', value: <Address pubkey={new PublicKey(compressedInfo.creator_hash)} raw /> },
        { label: 'Metadata Hash', value: <Address pubkey={new PublicKey(compressedInfo.data_hash)} raw /> },
    ];

    return (
        <OverviewCard title="Compression Info">
            <KeyValueRows rows={rows} />
        </OverviewCard>
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
