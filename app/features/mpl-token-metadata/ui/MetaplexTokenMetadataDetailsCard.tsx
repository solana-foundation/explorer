import {
    address,
    InstructionCardView,
    type InstructionField,
    type InstructionFieldList,
    InstructionFields,
    type InstructionNode,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import { PublicKey } from '@solana/web3.js';

import type { MetaplexTokenMetadataParsed } from '../lib/metaplex-token-metadata-client';
import type { MetaplexInstructionType } from '../lib/metaplex-token-metadata-parser';

const TITLE_PREFIX = 'Token Metadata Program';

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

type MetaplexTokenMetadataDetailsCardProps = {
    node: InstructionNode;
    ix: DispatchResult;
};

export function MetaplexTokenMetadataDetailsCard({ node, ix }: MetaplexTokenMetadataDetailsCardProps) {
    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const { info, type } = ix.parsed as MetaplexTokenMetadataParsed;

    return (
        <InstructionCardView node={node} title={`${TITLE_PREFIX}: ${IX_TITLES[type]}`}>
            <InstructionFields programId={node.programId} fields={instructionFields(type, info)} />
        </InstructionCardView>
    );
}

function instructionFields(type: MetaplexInstructionType, info: Record<string, unknown>): InstructionFieldList {
    switch (type) {
        case 'createMetadataAccountV3':
            return [
                account('Metadata', info.metadata),
                account('Mint', info.mint),
                account('Mint Authority', info.mintAuthority),
                account('Payer', info.payer),
                account('Update Authority', info.updateAuthority),
                data('Name', info.name),
                data('Symbol', info.symbol),
                data('URI', info.uri),
                royalty(info.sellerFeeBasisPoints),
                data('Mutable', info.isMutable),
            ];
        case 'createV1':
            return [
                account('Metadata', info.metadata),
                account('Master Edition', info.masterEdition),
                account('Mint', info.mint),
                account('Authority', info.authority),
                account('Payer', info.payer),
                account('Update Authority', info.updateAuthority),
                data('Name', info.name),
                data('Symbol', info.symbol),
                data('URI', info.uri),
                data('Token Standard', info.tokenStandard),
                royalty(info.sellerFeeBasisPoints),
                data('Mutable', info.isMutable),
            ];
        case 'updateMetadataAccountV2':
            return [
                account('Metadata', info.metadata),
                account('Update Authority', info.updateAuthority),
                account('New Update Authority', info.newUpdateAuthority),
                data('Name', info.name),
                data('Symbol', info.symbol),
                data('URI', info.uri),
                data('Primary Sale Happened', info.primarySaleHappened),
                data('Mutable', info.isMutable),
            ];
        case 'createMasterEditionV3':
            return [
                account('Edition', info.edition),
                account('Mint', info.mint),
                account('Update Authority', info.updateAuthority),
                account('Mint Authority', info.mintAuthority),
                account('Payer', info.payer),
                account('Metadata', info.metadata),
                data('Max Supply', info.maxSupply ?? 'Unlimited'),
            ];
        case 'mintNewEditionFromMasterEditionViaToken':
            return [
                account('New Edition', info.newEdition),
                account('New Mint', info.newMint),
                account('Master Edition', info.masterEdition),
                account('New Mint Authority', info.newMintAuthority),
                account('New Update Authority', info.newUpdateAuthority),
                account('Original Metadata', info.originalMetadata),
                account('Token Account Owner', info.tokenAccountOwner),
                data('Edition Number', info.edition),
            ];
        case 'burnV1':
            return [
                account('Metadata', info.metadata),
                account('Authority', info.authority),
                account('Mint', info.mint),
                account('Token', info.token),
                account('Master Edition', info.masterEdition),
            ];
        case 'burnNft':
            return [
                account('Metadata', info.metadata),
                account('Owner', info.owner),
                account('Mint', info.mint),
                account('Token Account', info.tokenAccount),
                account('Master Edition', info.masterEditionAccount),
                account('Collection Metadata', info.collectionMetadata),
            ];
        case 'burnEditionNft':
            return [
                account('Metadata', info.metadata),
                account('Owner', info.owner),
                account('Mint', info.mint),
                account('Print Edition', info.printEdition),
                account('Master Edition Mint', info.masterEditionMint),
                account('Master Token Account', info.masterTokenAccount),
                account('Master Edition', info.masterEdition),
                account('Edition Marker', info.editionMarker),
            ];
        case 'transferV1':
            return [
                account('Mint', info.mint),
                account('Source Token', info.sourceToken),
                account('Authority', info.authority),
                account('Destination Token', info.destinationToken),
                account('Destination Owner', info.destinationOwner),
                account('Metadata', info.metadata),
                account('Source Owner', info.sourceOwner),
            ];
        case 'mintV1':
            return [
                account('Mint', info.mint),
                account('Metadata', info.metadata),
                account('Token', info.token),
                account('Master Edition', info.masterEdition),
                account('Authority', info.authority),
                account('Payer', info.payer),
                account('Token Owner', info.tokenOwner),
            ];
        case 'updateV1':
            return [
                account('Authority', info.authority),
                account('Metadata', info.metadata),
                account('Mint', info.mint),
                account('Master Edition', info.masterEdition),
            ];
        case 'lockV1':
        case 'unlockV1':
            return [
                account('Authority', info.authority),
                account('Mint', info.mint),
                account('Token', info.token),
                account('Metadata', info.metadata),
                account('Token Owner', info.tokenOwner),
            ];
        case 'useV1':
            return [
                account('Authority', info.authority),
                account('Mint', info.mint),
                account('Token', info.token),
                account('Metadata', info.metadata),
            ];
        case 'signMetadata':
            return [account('Metadata', info.metadata), account('Creator', info.creator)];
        case 'verifyCollection':
        case 'setAndVerifyCollection':
            return [
                account('Metadata', info.metadata),
                account('Payer', info.payer),
                account('Update Authority', info.updateAuthority),
                account('Collection Authority', info.collectionAuthority),
                account('Collection', info.collection),
                account('Collection Master Edition', info.collectionMasterEditionAccount),
            ];
        case 'unverifyCollection':
            return [
                account('Metadata', info.metadata),
                account('Update Authority', info.updateAuthority),
                account('Collection Authority', info.collectionAuthority),
                account('Collection Mint', info.collectionMint),
                account('Collection Metadata', info.collectionMetadata),
                account('Collection Master Edition', info.collectionMasterEditionAccount),
            ];
        case 'verifySizedCollectionItem':
        case 'setAndVerifySizedCollectionItem':
            return [
                account('Metadata', info.metadata),
                account('Payer', info.payer),
                account('Update Authority', info.updateAuthority),
                account('Collection Authority', info.collectionAuthority),
                account('Collection', info.collection),
                account('Collection Master Edition', info.collectionMasterEditionAccount),
                account('Collection Mint', info.collectionMint),
            ];
        case 'unverifySizedCollectionItem':
            return [
                account('Metadata', info.metadata),
                account('Payer', info.payer),
                account('Update Authority', info.updateAuthority),
                account('Collection Authority', info.collectionAuthority),
                account('Collection Mint', info.collectionMint),
                account('Collection Master Edition', info.collectionMasterEditionAccount),
                account('Collection Metadata', info.collectionMetadata),
            ];
        case 'updatePrimarySaleHappenedViaToken':
            return [
                account('Metadata', info.metadata),
                account('Owner', info.owner),
                account('Token Account', info.tokenAccount),
            ];
        case 'delegateCollectionV1':
        case 'delegateDataV1':
        case 'delegateLockedTransferV1':
        case 'delegateSaleV1':
        case 'delegateStakingV1':
        case 'delegateStandardV1':
        case 'delegateTransferV1':
        case 'delegateUtilityV1':
        case 'revokeCollectionV1':
        case 'revokeDataV1':
        case 'revokeLockedTransferV1':
        case 'revokeSaleV1':
        case 'revokeStakingV1':
        case 'revokeStandardV1':
        case 'revokeTransferV1':
        case 'revokeUtilityV1':
            return [
                account('Delegate Record', info.delegateRecord),
                account('Delegate', info.delegate),
                account('Metadata', info.metadata),
                account('Master Edition', info.masterEdition),
                account('Token Record', info.tokenRecord),
                account('Mint', info.mint),
                account('Token', info.token),
                account('Authority', info.authority),
                account('Payer', info.payer),
                account('Authorization Rules', info.authorizationRules),
            ];
        case 'printV1':
        case 'printV2':
            return [
                account('Edition Metadata', info.editionMetadata),
                account('Edition', info.edition),
                account('Edition Mint', info.editionMint),
                account('Edition Token Account Owner', info.editionTokenAccountOwner),
                account('Edition Token Account', info.editionTokenAccount),
                account('Edition Mint Authority', info.editionMintAuthority),
                account('Edition Token Record', info.editionTokenRecord),
                account('Master Edition', info.masterEdition),
                account('Edition Marker', info.editionMarkerPda),
                account('Payer', info.payer),
                account('Master Token Account Owner', info.masterTokenAccountOwner),
                account('Master Token Account', info.masterTokenAccount),
                account('Master Metadata', info.masterMetadata),
                account('Update Authority', info.updateAuthority),
                account('Holder Delegate Record', info.holderDelegateRecord),
                account('Delegate', info.delegate),
            ];
    }
}

function account(label: string, value: unknown): InstructionField | undefined {
    return value instanceof PublicKey ? address(label, value) : undefined;
}

function data(label: string, value: unknown): InstructionField | undefined {
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
            return text(label, String(value));
        default:
            return undefined;
    }
}

function royalty(basisPoints: unknown): InstructionField | undefined {
    if (typeof basisPoints !== 'number') return undefined;
    const pct = basisPoints / 100;
    return text('Royalty', pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(2)}%`);
}
