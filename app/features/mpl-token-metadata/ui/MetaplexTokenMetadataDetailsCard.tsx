import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { MetaplexInstructionType, parseMetaplexTokenMetadataInstruction } from '@features/mpl-token-metadata';
import { ParsedInstruction, PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';
import { BaseTable } from '@/app/shared/ui/Table';

const IX_TITLES: Record<MetaplexInstructionType, string> = {
    burnEditionNft: 'Burn Edition NFT',
    burnNft: 'Burn NFT',
    burnV1: 'Burn',
    createMasterEditionV3: 'Create Master Edition V3',
    createMetadataAccountV3: 'Create Metadata Account V3',
    createV1: 'Create',
    delegateCollectionV1: 'Delegate Collection',
    delegateDataV1: 'Delegate Data',
    delegateLockedTransferV1: 'Delegate Locked Transfer',
    delegateSaleV1: 'Delegate Sale',
    delegateStakingV1: 'Delegate Staking',
    delegateStandardV1: 'Delegate Standard',
    delegateTransferV1: 'Delegate Transfer',
    delegateUtilityV1: 'Delegate Utility',
    lockV1: 'Lock',
    mintNewEditionFromMasterEditionViaToken: 'Mint New Edition',
    mintV1: 'Mint',
    printV1: 'Print V1',
    printV2: 'Print V2',
    revokeCollectionV1: 'Revoke Collection',
    revokeDataV1: 'Revoke Data',
    revokeLockedTransferV1: 'Revoke Locked Transfer',
    revokeSaleV1: 'Revoke Sale',
    revokeStakingV1: 'Revoke Staking',
    revokeStandardV1: 'Revoke Standard',
    revokeTransferV1: 'Revoke Transfer',
    revokeUtilityV1: 'Revoke Utility',
    setAndVerifyCollection: 'Set And Verify Collection',
    setAndVerifySizedCollectionItem: 'Set And Verify Sized Collection',
    signMetadata: 'Sign Metadata',
    transferV1: 'Transfer',
    unlockV1: 'Unlock',
    unverifyCollection: 'Unverify Collection',
    unverifySizedCollectionItem: 'Unverify Sized Collection Item',
    updateMetadataAccountV2: 'Update Metadata Account V2',
    updatePrimarySaleHappenedViaToken: 'Update Primary Sale',
    updateV1: 'Update',
    useV1: 'Use',
    verifyCollection: 'Verify Collection',
    verifySizedCollectionItem: 'Verify Sized Collection Item',
};

function AccountRow({ label, pubkey }: { label: string; pubkey: unknown }) {
    if (!(pubkey instanceof PublicKey)) return null;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">
                <Address pubkey={pubkey} alignRight link />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

function DataRow({ label, value }: { label: string; value: unknown }) {
    if (value === null || value === undefined) return null;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">{String(value)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function RoyaltyRow({ basisPoints }: { basisPoints: unknown }) {
    if (typeof basisPoints !== 'number') return null;
    const pct = basisPoints / 100;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>Royalty</BaseTable.Cell>
            <BaseTable.Cell className="text-right">{pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(2)}%`}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function GenericAccountRows({ ix }: { ix: TransactionInstruction }) {
    return (
        <>
            {ix.keys.map((key, i) => (
                <BaseTable.Row key={i}>
                    <BaseTable.Cell>Account #{i + 1}</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={key.pubkey} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
        </>
    );
}

function renderContent(
    type: MetaplexInstructionType,
    info: Record<string, unknown>,
    ix: TransactionInstruction,
): React.ReactNode {
    switch (type) {
        case 'createMetadataAccountV3':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Mint Authority" pubkey={info.mintAuthority} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <DataRow label="Name" value={info.name} />
                    <DataRow label="Symbol" value={info.symbol} />
                    <DataRow label="URI" value={info.uri} />
                    <RoyaltyRow basisPoints={info.sellerFeeBasisPoints} />
                    <DataRow label="Mutable" value={info.isMutable} />
                </>
            );
        case 'createV1':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <DataRow label="Name" value={info.name} />
                    <DataRow label="Symbol" value={info.symbol} />
                    <DataRow label="URI" value={info.uri} />
                    <DataRow label="Token Standard" value={info.tokenStandard} />
                    <RoyaltyRow basisPoints={info.sellerFeeBasisPoints} />
                    <DataRow label="Mutable" value={info.isMutable} />
                </>
            );
        case 'updateMetadataAccountV2':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="New Update Authority" pubkey={info.newUpdateAuthority} />
                    <DataRow label="Name" value={info.name} />
                    <DataRow label="Symbol" value={info.symbol} />
                    <DataRow label="URI" value={info.uri} />
                    <DataRow label="Primary Sale Happened" value={info.primarySaleHappened} />
                    <DataRow label="Mutable" value={info.isMutable} />
                </>
            );
        case 'createMasterEditionV3':
            return (
                <>
                    <AccountRow label="Edition" pubkey={info.edition} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="Mint Authority" pubkey={info.mintAuthority} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <DataRow label="Max Supply" value={info.maxSupply ?? 'Unlimited'} />
                </>
            );
        case 'mintNewEditionFromMasterEditionViaToken':
            return (
                <>
                    <AccountRow label="New Edition" pubkey={info.newEdition} />
                    <AccountRow label="New Mint" pubkey={info.newMint} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                    <AccountRow label="New Mint Authority" pubkey={info.newMintAuthority} />
                    <AccountRow label="New Update Authority" pubkey={info.newUpdateAuthority} />
                    <AccountRow label="Original Metadata" pubkey={info.originalMetadata} />
                    <AccountRow label="Token Account Owner" pubkey={info.tokenAccountOwner} />
                    <DataRow label="Edition Number" value={info.edition} />
                </>
            );
        case 'burnV1':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Token" pubkey={info.token} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                </>
            );
        case 'burnNft':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Owner" pubkey={info.owner} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Token Account" pubkey={info.tokenAccount} />
                    <AccountRow label="Master Edition" pubkey={info.masterEditionAccount} />
                    <AccountRow label="Collection Metadata" pubkey={info.collectionMetadata} />
                </>
            );
        case 'burnEditionNft':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Owner" pubkey={info.owner} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Print Edition" pubkey={info.printEdition} />
                    <AccountRow label="Master Edition Mint" pubkey={info.masterEditionMint} />
                    <AccountRow label="Master Token Account" pubkey={info.masterTokenAccount} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                    <AccountRow label="Edition Marker" pubkey={info.editionMarker} />
                </>
            );
        case 'transferV1':
            return (
                <>
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Source Token" pubkey={info.sourceToken} />
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Destination Token" pubkey={info.destinationToken} />
                    <AccountRow label="Destination Owner" pubkey={info.destinationOwner} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Source Owner" pubkey={info.sourceOwner} />
                </>
            );
        case 'mintV1':
            return (
                <>
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Token" pubkey={info.token} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Token Owner" pubkey={info.tokenOwner} />
                </>
            );
        case 'updateV1':
            return (
                <>
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Master Edition" pubkey={info.masterEdition} />
                </>
            );
        case 'lockV1':
        case 'unlockV1':
            return (
                <>
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Token" pubkey={info.token} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Token Owner" pubkey={info.tokenOwner} />
                </>
            );
        case 'useV1':
            return (
                <>
                    <AccountRow label="Authority" pubkey={info.authority} />
                    <AccountRow label="Mint" pubkey={info.mint} />
                    <AccountRow label="Token" pubkey={info.token} />
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                </>
            );
        case 'signMetadata':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Creator" pubkey={info.creator} />
                </>
            );
        case 'verifyCollection':
        case 'setAndVerifyCollection':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="Collection Authority" pubkey={info.collectionAuthority} />
                    <AccountRow label="Collection" pubkey={info.collection} />
                    <AccountRow label="Collection Master Edition" pubkey={info.collectionMasterEditionAccount} />
                </>
            );
        case 'unverifyCollection':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="Collection Authority" pubkey={info.collectionAuthority} />
                    <AccountRow label="Collection Mint" pubkey={info.collectionMint} />
                    <AccountRow label="Collection Metadata" pubkey={info.collectionMetadata} />
                    <AccountRow label="Collection Master Edition" pubkey={info.collectionMasterEditionAccount} />
                </>
            );
        case 'verifySizedCollectionItem':
        case 'setAndVerifySizedCollectionItem':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="Collection Authority" pubkey={info.collectionAuthority} />
                    <AccountRow label="Collection" pubkey={info.collection} />
                    <AccountRow label="Collection Master Edition" pubkey={info.collectionMasterEditionAccount} />
                    <AccountRow label="Collection Mint" pubkey={info.collectionMint} />
                </>
            );
        case 'unverifySizedCollectionItem':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Payer" pubkey={info.payer} />
                    <AccountRow label="Update Authority" pubkey={info.updateAuthority} />
                    <AccountRow label="Collection Authority" pubkey={info.collectionAuthority} />
                    <AccountRow label="Collection Mint" pubkey={info.collectionMint} />
                    <AccountRow label="Collection Master Edition" pubkey={info.collectionMasterEditionAccount} />
                    <AccountRow label="Collection Metadata" pubkey={info.collectionMetadata} />
                </>
            );
        case 'updatePrimarySaleHappenedViaToken':
            return (
                <>
                    <AccountRow label="Metadata" pubkey={info.metadata} />
                    <AccountRow label="Owner" pubkey={info.owner} />
                    <AccountRow label="Token Account" pubkey={info.tokenAccount} />
                </>
            );
        default: {
            const entries = Object.entries(info);
            return entries.length > 0 ? (
                <>
                    {entries.map(([key, value]) =>
                        value instanceof PublicKey ? (
                            <AccountRow key={key} label={key} pubkey={value} />
                        ) : (
                            <DataRow key={key} label={key} value={value} />
                        ),
                    )}
                </>
            ) : (
                <GenericAccountRows ix={ix} />
            );
        }
    }
}

export function MetaplexTokenMetadataDetailsCard({
    childIndex,
    index,
    innerCards,
    ix,
    parsedIx,
    result,
    InstructionCardComponent = InstructionCard,
}: {
    childIndex?: number;
    index: number;
    innerCards?: JSX.Element[];
    ix: TransactionInstruction;
    /**
     * Already-parsed slice output from the upstream dispatcher. When provided
     * and non-empty, skip re-parsing — the dispatcher already did the work.
     * Tx-page predicate-based callers pass nothing and the card parses itself.
     */
    parsedIx?: ParsedInstruction;
    result: SignatureResult;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const parsed = React.useMemo(() => {
        if (parsedIx?.parsed.type) {
            // Dispatcher already ran the slice parser; reuse its output.
            // The cast is safe by construction: a non-empty `type` from the MPL
            // slice is always a MetaplexInstructionType, and the slice contract
            // is that `info` is `Record<string, unknown>` for this program.
            return {
                info: parsedIx.parsed.info as Record<string, unknown>,
                type: parsedIx.parsed.type as MetaplexInstructionType,
            };
        }
        return parseMetaplexTokenMetadataInstruction(toKitInstruction(ix));
    }, [ix, parsedIx]);

    if (!parsed) {
        return (
            <InstructionCardComponent
                ix={ix}
                index={index}
                result={result}
                title="Token Metadata Program: Unknown Instruction"
                innerCards={innerCards}
                childIndex={childIndex}
                defaultRaw
            />
        );
    }

    const { type, info } = parsed;
    const title = `Token Metadata Program: ${IX_TITLES[type] ?? type}`;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title={title}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            {renderContent(type, info, ix)}
        </InstructionCardComponent>
    );
}
