import {
    type CreateMasterEditionV3InstructionData,
    type CreateMetadataAccountV3InstructionData,
    type CreateV1InstructionData,
    getCreateMasterEditionV3InstructionDataSerializer,
    getCreateMetadataAccountV3InstructionDataSerializer,
    getCreateV1InstructionDataSerializer,
    getMintNewEditionFromMasterEditionViaTokenInstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
    type MintNewEditionFromMasterEditionViaTokenInstructionData,
    TokenStandard,
    type UpdateMetadataAccountV2InstructionData,
} from '@metaplex-foundation/mpl-token-metadata';
import { unwrapOption } from '@metaplex-foundation/umi';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

export type MetaplexInstructionType =
    | 'burnEditionNft'
    | 'burnNft'
    | 'burnV1'
    | 'createMasterEditionV3'
    | 'createMetadataAccountV3'
    | 'createV1'
    | 'delegateCollectionV1'
    | 'delegateDataV1'
    | 'delegateLockedTransferV1'
    | 'delegateSaleV1'
    | 'delegateStakingV1'
    | 'delegateStandardV1'
    | 'delegateTransferV1'
    | 'delegateUtilityV1'
    | 'lockV1'
    | 'mintNewEditionFromMasterEditionViaToken'
    | 'mintV1'
    | 'printV1'
    | 'printV2'
    | 'revokeCollectionV1'
    | 'revokeDataV1'
    | 'revokeLockedTransferV1'
    | 'revokeSaleV1'
    | 'revokeStakingV1'
    | 'revokeStandardV1'
    | 'revokeTransferV1'
    | 'revokeUtilityV1'
    | 'setAndVerifyCollection'
    | 'setAndVerifySizedCollectionItem'
    | 'signMetadata'
    | 'transferV1'
    | 'unlockV1'
    | 'unverifyCollection'
    | 'unverifySizedCollectionItem'
    | 'updateMetadataAccountV2'
    | 'updatePrimarySaleHappenedViaToken'
    | 'updateV1'
    | 'useV1'
    | 'verifyCollection'
    | 'verifySizedCollectionItem';

type SerializerFactory = () => { deserialize(data: Uint8Array): [unknown, number] };

type DataExtractor = (raw: unknown) => Record<string, unknown>;

type InstructionDef = {
    name: MetaplexInstructionType;
    /** Account names by key index. Empty string skips an unnamed position. */
    accounts: readonly string[];
    getSerializer?: SerializerFactory;
    extractData?: DataExtractor;
};

type Entry = InstructionDef | { sub: Record<number, InstructionDef> };

function tokenStandardToString(standard: TokenStandard): string {
    switch (standard) {
        case TokenStandard.NonFungible:
            return 'Non-Fungible';
        case TokenStandard.FungibleAsset:
            return 'Fungible Asset';
        case TokenStandard.Fungible:
            return 'Fungible';
        case TokenStandard.NonFungibleEdition:
            return 'Non-Fungible Edition';
        case TokenStandard.ProgrammableNonFungible:
            return 'Programmable Non-Fungible';
        case TokenStandard.ProgrammableNonFungibleEdition:
            return 'Programmable Non-Fungible Edition';
        default:
            return String(standard);
    }
}

const INSTRUCTIONS: Record<number, Entry> = {
    11: {
        // prettier-ignore
        accounts: ['', 'newEdition', 'masterEdition', 'newMint', '', 'newMintAuthority', '', 'tokenAccountOwner', '', 'newUpdateAuthority', 'originalMetadata'],

        extractData: raw => {
            const { mintNewEditionFromMasterEditionViaTokenArgs } =
                raw as MintNewEditionFromMasterEditionViaTokenInstructionData;
            return { edition: Number(mintNewEditionFromMasterEditionViaTokenArgs.edition) };
        },
        getSerializer: getMintNewEditionFromMasterEditionViaTokenInstructionDataSerializer,
        name: 'mintNewEditionFromMasterEditionViaToken',
    },
    15: {
        accounts: ['metadata', 'updateAuthority'],
        extractData: raw => {
            const { data, isMutable, newUpdateAuthority, primarySaleHappened } =
                raw as UpdateMetadataAccountV2InstructionData;
            const dataV2 = unwrapOption(data);
            const newUpdateAuthorityKey = unwrapOption(newUpdateAuthority);
            return {
                isMutable: unwrapOption(isMutable),
                name: dataV2?.name ?? null,
                newUpdateAuthority: newUpdateAuthorityKey ? new PublicKey(newUpdateAuthorityKey) : null,
                primarySaleHappened: unwrapOption(primarySaleHappened),
                symbol: dataV2?.symbol ?? null,
                uri: dataV2?.uri ?? null,
            };
        },
        getSerializer: getUpdateMetadataAccountV2InstructionDataSerializer,
        name: 'updateMetadataAccountV2',
    },
    17: {
        accounts: ['edition', 'mint', 'updateAuthority', 'mintAuthority', 'payer', 'metadata'],
        extractData: raw => {
            const { maxSupply } = raw as CreateMasterEditionV3InstructionData;
            const maxSupplyRaw = unwrapOption(maxSupply);
            return { maxSupply: maxSupplyRaw !== null ? Number(maxSupplyRaw) : null };
        },
        getSerializer: getCreateMasterEditionV3InstructionDataSerializer,
        name: 'createMasterEditionV3',
    },
    25: {
        accounts: [
            'metadata',
            'payer',
            'updateAuthority',
            'collectionAuthority',
            'collection',
            'collectionMasterEditionAccount',
        ],
        name: 'setAndVerifyCollection',
    },
    26: {
        accounts: [
            'metadata',
            'payer',
            'updateAuthority',
            'collectionAuthority',
            'collection',
            'collectionMasterEditionAccount',
        ],
        name: 'verifyCollection',
    },
    27: {
        accounts: [
            'metadata',
            'updateAuthority',
            'collectionAuthority',
            'collectionMint',
            'collectionMetadata',
            'collectionMasterEditionAccount',
        ],
        name: 'unverifyCollection',
    },
    29: {
        accounts: ['metadata', 'owner', 'mint', 'tokenAccount', 'masterEditionAccount', 'collectionMetadata'],
        name: 'burnNft',
    },
    30: {
        accounts: [
            'metadata',
            'payer',
            'updateAuthority',
            'collectionAuthority',
            'collection',
            'collectionMasterEditionAccount',
            'collectionMint',
        ],
        name: 'verifySizedCollectionItem',
    },
    31: {
        accounts: [
            'metadata',
            'payer',
            'updateAuthority',
            'collectionAuthority',
            'collectionMint',
            'collectionMasterEditionAccount',
            'collectionMetadata',
        ],
        name: 'unverifySizedCollectionItem',
    },
    32: {
        accounts: [
            'metadata',
            'payer',
            'updateAuthority',
            'collectionAuthority',
            'collection',
            'collectionMasterEditionAccount',
            'collectionMint',
        ],
        name: 'setAndVerifySizedCollectionItem',
    },
    33: {
        accounts: ['metadata', 'mint', 'mintAuthority', 'payer', 'updateAuthority'],
        extractData: raw => {
            const { data, isMutable } = raw as CreateMetadataAccountV3InstructionData;
            return {
                isMutable,
                name: data.name,
                sellerFeeBasisPoints: data.sellerFeeBasisPoints,
                symbol: data.symbol,
                uri: data.uri,
            };
        },
        getSerializer: getCreateMetadataAccountV3InstructionDataSerializer,
        name: 'createMetadataAccountV3',
    },
    37: {
        accounts: [
            'metadata',
            'owner',
            'mint',
            'printEdition',
            'masterEditionMint',
            'masterTokenAccount',
            'masterEdition',
            'editionMarker',
        ],
        name: 'burnEditionNft',
    },
    4: {
        accounts: ['metadata', 'owner', 'tokenAccount'],
        name: 'updatePrimarySaleHappenedViaToken',
    },
    41: {
        // prettier-ignore
        accounts: ['metadata', 'authority', 'token', 'mint', '', '', '', '', '', 'masterEdition'],

        name: 'burnV1',
    },
    42: {
        accounts: ['metadata', 'masterEdition', 'mint', 'authority', 'payer', 'updateAuthority'],
        extractData: raw => {
            const { isMutable, name, sellerFeeBasisPoints, symbol, tokenStandard, uri } =
                raw as CreateV1InstructionData;
            return {
                isMutable,
                name,
                sellerFeeBasisPoints: Number(sellerFeeBasisPoints.basisPoints),
                symbol,
                tokenStandard: tokenStandardToString(tokenStandard),
                uri,
            };
        },
        getSerializer: getCreateV1InstructionDataSerializer,
        name: 'createV1',
    },
    43: {
        accounts: ['mint', 'metadata', 'token', 'masterEdition', 'authority', 'payer', 'tokenOwner'],
        name: 'mintV1',
    },
    44: {
        sub: {
            0: { accounts: [], name: 'delegateCollectionV1' },
            1: { accounts: [], name: 'delegateSaleV1' },
            2: { accounts: [], name: 'delegateTransferV1' },
            3: { accounts: [], name: 'delegateDataV1' },
            4: { accounts: [], name: 'delegateUtilityV1' },
            5: { accounts: [], name: 'delegateStakingV1' },
            6: { accounts: [], name: 'delegateStandardV1' },
            7: { accounts: [], name: 'delegateLockedTransferV1' },
        },
    },
    45: {
        sub: {
            0: { accounts: [], name: 'revokeCollectionV1' },
            1: { accounts: [], name: 'revokeSaleV1' },
            2: { accounts: [], name: 'revokeTransferV1' },
            3: { accounts: [], name: 'revokeDataV1' },
            4: { accounts: [], name: 'revokeUtilityV1' },
            5: { accounts: [], name: 'revokeStakingV1' },
            6: { accounts: [], name: 'revokeStandardV1' },
            7: { accounts: [], name: 'revokeLockedTransferV1' },
        },
    },
    46: {
        accounts: ['authority', 'mint', 'token', 'metadata', 'tokenOwner'],
        name: 'lockV1',
    },
    47: {
        accounts: ['authority', 'mint', 'token', 'metadata', 'tokenOwner'],
        name: 'unlockV1',
    },
    49: {
        accounts: [
            'mint',
            'sourceToken',
            'authority',
            'destinationToken',
            'destinationOwner',
            'metadata',
            '',
            'sourceOwner',
        ],
        name: 'transferV1',
    },
    50: {
        accounts: ['authority', 'metadata', 'mint', 'masterEdition'],
        name: 'updateV1',
    },
    51: {
        accounts: ['authority', 'mint', 'token', 'metadata'],
        name: 'useV1',
    },
    55: {
        sub: {
            0: { accounts: [], name: 'printV1' },
            1: { accounts: [], name: 'printV2' },
        },
    },
    7: {
        accounts: ['metadata', 'creator'],
        name: 'signMetadata',
    },
};

function lookupDef(data: Uint8Array): InstructionDef | undefined {
    if (data.length === 0) return undefined;
    const entry = INSTRUCTIONS[data[0]];
    if (!entry) return undefined;
    if ('sub' in entry) {
        if (data.length < 2) return undefined;
        return entry.sub[data[1]];
    }
    return entry;
}

export function identifyInstructionType(data: Uint8Array): MetaplexInstructionType | undefined {
    return lookupDef(data)?.name;
}

function buildInfo(def: InstructionDef, instruction: TransactionInstruction): Record<string, unknown> {
    const info: Record<string, unknown> = {};
    def.accounts.forEach((name, i) => {
        if (name) info[name] = instruction.keys[i]?.pubkey;
    });
    if (def.getSerializer) {
        const [raw] = def.getSerializer().deserialize(instruction.data);
        if (def.extractData) Object.assign(info, def.extractData(raw));
    }
    return info;
}

export function parseMetaplexTokenMetadataInstruction(
    instruction: TransactionInstruction,
): { type: MetaplexInstructionType; info: Record<string, unknown> } | undefined {
    const def = lookupDef(instruction.data);
    if (!def) return undefined;

    try {
        return { info: buildInfo(def, instruction), type: def.name };
    } catch (e) {
        // Even if data decoding fails, returning the type name is still useful
        Logger.warn('[mpl-token-metadata] Failed to decode instruction data', { error: e, type: def.name });
        return { info: {}, type: def.name };
    }
}
