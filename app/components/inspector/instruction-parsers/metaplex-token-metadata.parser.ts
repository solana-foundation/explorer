import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getCreateMetadataAccountV3InstructionDataSerializer,
    getCreateV1InstructionDataSerializer,
    getMintNewEditionFromMasterEditionViaTokenInstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { unwrapOption } from '@metaplex-foundation/umi';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export const TOKEN_METADATA_PROGRAM_ADDRESS = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

const PRIMARY_DISCRIMINATOR_MAP: Record<number, string> = {
    11: 'mintNewEditionFromMasterEditionViaToken',
    15: 'updateMetadataAccountV2',
    17: 'createMasterEditionV3',
    25: 'setAndVerifyCollection',
    26: 'verifyCollection',
    27: 'unverifyCollection',
    29: 'burnNft',
    30: 'verifySizedCollectionItem',
    31: 'unverifySizedCollectionItem',
    32: 'setAndVerifySizedCollectionItem',
    33: 'createMetadataAccountV3',
    37: 'burnEditionNft',
    4: 'updatePrimarySaleHappenedViaToken',
    41: 'burnV1',
    42: 'createV1',
    43: 'mintV1',
    46: 'lockV1',
    47: 'unlockV1',
    49: 'transferV1',
    50: 'updateV1',
    51: 'useV1',
    7: 'signMetadata',
};

const DELEGATE_SUB_DISCRIMINATOR_MAP: Record<number, string> = {
    0: 'delegateCollectionV1',
    1: 'delegateSaleV1',
    2: 'delegateTransferV1',
    3: 'delegateDataV1',
    4: 'delegateUtilityV1',
    5: 'delegateStakingV1',
    6: 'delegateStandardV1',
    7: 'delegateLockedTransferV1',
};

const REVOKE_SUB_DISCRIMINATOR_MAP: Record<number, string> = {
    0: 'revokeCollectionV1',
    1: 'revokeSaleV1',
    2: 'revokeTransferV1',
    3: 'revokeDataV1',
    4: 'revokeUtilityV1',
    5: 'revokeStakingV1',
    6: 'revokeStandardV1',
    7: 'revokeLockedTransferV1',
};

const PRINT_SUB_DISCRIMINATOR_MAP: Record<number, string> = {
    0: 'printV1',
    1: 'printV2',
};

// Maps primary bytes that require a secondary byte to identify the instruction type
const SUB_DISCRIMINATOR_MAPS: Record<number, Record<number, string>> = {
    44: DELEGATE_SUB_DISCRIMINATOR_MAP,
    45: REVOKE_SUB_DISCRIMINATOR_MAP,
    55: PRINT_SUB_DISCRIMINATOR_MAP,
};

export function identifyInstructionType(data: Uint8Array): string | null {
    if (data.length === 0) return null;
    const primary = data[0];

    const subMap = SUB_DISCRIMINATOR_MAPS[primary];
    if (subMap) {
        if (data.length < 2) return null;
        return subMap[data[1]] ?? null;
    }

    return PRIMARY_DISCRIMINATOR_MAP[primary] ?? null;
}

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

// Hoisted serializers — construction allocates nested objects, so share across calls
const CREATE_METADATA_V3_SERIALIZER = getCreateMetadataAccountV3InstructionDataSerializer();
const UPDATE_METADATA_V2_SERIALIZER = getUpdateMetadataAccountV2InstructionDataSerializer();
const CREATE_MASTER_EDITION_V3_SERIALIZER = getCreateMasterEditionV3InstructionDataSerializer();
const CREATE_V1_SERIALIZER = getCreateV1InstructionDataSerializer();
const MINT_NEW_EDITION_SERIALIZER = getMintNewEditionFromMasterEditionViaTokenInstructionDataSerializer();

function decodeInstructionInfo(type: string, instruction: TransactionInstruction): Record<string, unknown> {
    const keys = instruction.keys;

    switch (type) {
        case 'createMetadataAccountV3': {
            const [data] = CREATE_METADATA_V3_SERIALIZER.deserialize(instruction.data);
            return {
                isMutable: data.isMutable,
                metadata: keys[0]?.pubkey,
                mint: keys[1]?.pubkey,
                mintAuthority: keys[2]?.pubkey,
                name: data.data.name,
                payer: keys[3]?.pubkey,
                sellerFeeBasisPoints: data.data.sellerFeeBasisPoints,
                symbol: data.data.symbol,
                updateAuthority: keys[4]?.pubkey,
                uri: data.data.uri,
            };
        }
        case 'updateMetadataAccountV2': {
            const [data] = UPDATE_METADATA_V2_SERIALIZER.deserialize(instruction.data);
            const dataV2 = unwrapOption(data.data);
            const newUpdateAuthorityStr = unwrapOption(data.newUpdateAuthority);
            const isMutable = unwrapOption(data.isMutable);
            const primarySaleHappened = unwrapOption(data.primarySaleHappened);
            return {
                isMutable,
                metadata: keys[0]?.pubkey,
                name: dataV2?.name ?? null,
                newUpdateAuthority: newUpdateAuthorityStr ? new PublicKey(newUpdateAuthorityStr) : null,
                primarySaleHappened,
                symbol: dataV2?.symbol ?? null,
                updateAuthority: keys[1]?.pubkey,
                uri: dataV2?.uri ?? null,
            };
        }
        case 'createMasterEditionV3': {
            const [data] = CREATE_MASTER_EDITION_V3_SERIALIZER.deserialize(instruction.data);
            const maxSupplyRaw = unwrapOption(data.maxSupply);
            return {
                edition: keys[0]?.pubkey,
                maxSupply: maxSupplyRaw !== null ? Number(maxSupplyRaw) : null,
                metadata: keys[5]?.pubkey,
                mint: keys[1]?.pubkey,
                mintAuthority: keys[3]?.pubkey,
                payer: keys[4]?.pubkey,
                updateAuthority: keys[2]?.pubkey,
            };
        }
        case 'createV1': {
            const [data] = CREATE_V1_SERIALIZER.deserialize(instruction.data);
            return {
                authority: keys[3]?.pubkey,
                isMutable: data.isMutable,
                masterEdition: keys[1]?.pubkey,
                metadata: keys[0]?.pubkey,
                mint: keys[2]?.pubkey,
                name: data.name,
                payer: keys[4]?.pubkey,
                sellerFeeBasisPoints:
                    typeof data.sellerFeeBasisPoints === 'object' && data.sellerFeeBasisPoints !== null
                        ? Number((data.sellerFeeBasisPoints as { basisPoints: bigint }).basisPoints)
                        : Number(data.sellerFeeBasisPoints),
                symbol: data.symbol,
                tokenStandard: tokenStandardToString(data.tokenStandard),
                updateAuthority: keys[5]?.pubkey,
                uri: data.uri,
            };
        }
        case 'mintNewEditionFromMasterEditionViaToken': {
            const [data] = MINT_NEW_EDITION_SERIALIZER.deserialize(instruction.data);
            return {
                edition: Number(data.mintNewEditionFromMasterEditionViaTokenArgs.edition),
                masterEdition: keys[2]?.pubkey,
                newEdition: keys[1]?.pubkey,
                newMint: keys[3]?.pubkey,
                newMintAuthority: keys[5]?.pubkey,
                newUpdateAuthority: keys[9]?.pubkey,
                originalMetadata: keys[10]?.pubkey,
                tokenAccountOwner: keys[7]?.pubkey,
            };
        }
        case 'burnV1': {
            return {
                authority: keys[1]?.pubkey,
                masterEdition: keys[9]?.pubkey,
                metadata: keys[0]?.pubkey,
                mint: keys[3]?.pubkey,
                token: keys[2]?.pubkey,
            };
        }
        case 'transferV1': {
            return {
                authority: keys[2]?.pubkey,
                destinationOwner: keys[4]?.pubkey,
                destinationToken: keys[3]?.pubkey,
                metadata: keys[5]?.pubkey,
                mint: keys[0]?.pubkey,
                sourceOwner: keys[7]?.pubkey,
                sourceToken: keys[1]?.pubkey,
            };
        }
        case 'mintV1': {
            return {
                authority: keys[4]?.pubkey,
                masterEdition: keys[3]?.pubkey,
                metadata: keys[1]?.pubkey,
                mint: keys[0]?.pubkey,
                payer: keys[5]?.pubkey,
                token: keys[2]?.pubkey,
                tokenOwner: keys[6]?.pubkey,
            };
        }
        case 'updateV1': {
            return {
                authority: keys[0]?.pubkey,
                masterEdition: keys[3]?.pubkey,
                metadata: keys[1]?.pubkey,
                mint: keys[2]?.pubkey,
            };
        }
        case 'lockV1':
        case 'unlockV1': {
            return {
                authority: keys[0]?.pubkey,
                metadata: keys[3]?.pubkey,
                mint: keys[1]?.pubkey,
                token: keys[2]?.pubkey,
                tokenOwner: keys[4]?.pubkey,
            };
        }
        case 'useV1': {
            return {
                authority: keys[0]?.pubkey,
                metadata: keys[3]?.pubkey,
                mint: keys[1]?.pubkey,
                token: keys[2]?.pubkey,
            };
        }
        case 'signMetadata': {
            return {
                creator: keys[1]?.pubkey,
                metadata: keys[0]?.pubkey,
            };
        }
        case 'verifyCollection':
        case 'setAndVerifyCollection': {
            return {
                collection: keys[4]?.pubkey,
                collectionAuthority: keys[3]?.pubkey,
                collectionMasterEditionAccount: keys[5]?.pubkey,
                metadata: keys[0]?.pubkey,
                payer: keys[1]?.pubkey,
                updateAuthority: keys[2]?.pubkey,
            };
        }
        case 'unverifyCollection': {
            return {
                collectionAuthority: keys[2]?.pubkey,
                collectionMasterEditionAccount: keys[5]?.pubkey,
                collectionMetadata: keys[4]?.pubkey,
                collectionMint: keys[3]?.pubkey,
                metadata: keys[0]?.pubkey,
                updateAuthority: keys[1]?.pubkey,
            };
        }
        case 'verifySizedCollectionItem':
        case 'setAndVerifySizedCollectionItem': {
            return {
                collection: keys[4]?.pubkey,
                collectionAuthority: keys[3]?.pubkey,
                collectionMasterEditionAccount: keys[5]?.pubkey,
                collectionMint: keys[6]?.pubkey,
                metadata: keys[0]?.pubkey,
                payer: keys[1]?.pubkey,
                updateAuthority: keys[2]?.pubkey,
            };
        }
        case 'unverifySizedCollectionItem': {
            return {
                collectionAuthority: keys[3]?.pubkey,
                collectionMasterEditionAccount: keys[5]?.pubkey,
                collectionMetadata: keys[6]?.pubkey,
                collectionMint: keys[4]?.pubkey,
                metadata: keys[0]?.pubkey,
                payer: keys[1]?.pubkey,
                updateAuthority: keys[2]?.pubkey,
            };
        }
        case 'burnNft': {
            return {
                collectionMetadata: keys[5]?.pubkey,
                masterEditionAccount: keys[4]?.pubkey,
                metadata: keys[0]?.pubkey,
                mint: keys[2]?.pubkey,
                owner: keys[1]?.pubkey,
                tokenAccount: keys[3]?.pubkey,
            };
        }
        case 'burnEditionNft': {
            return {
                editionMarker: keys[7]?.pubkey,
                masterEdition: keys[6]?.pubkey,
                masterEditionMint: keys[4]?.pubkey,
                masterTokenAccount: keys[5]?.pubkey,
                metadata: keys[0]?.pubkey,
                mint: keys[2]?.pubkey,
                owner: keys[1]?.pubkey,
                printEdition: keys[3]?.pubkey,
            };
        }
        case 'updatePrimarySaleHappenedViaToken': {
            return {
                metadata: keys[0]?.pubkey,
                owner: keys[1]?.pubkey,
                tokenAccount: keys[2]?.pubkey,
            };
        }
        default: {
            return {};
        }
    }
}

export function parseMetaplexTokenMetadataInstruction(
    instruction: TransactionInstruction,
): { type: string; info: Record<string, unknown> } | null {
    const type = identifyInstructionType(instruction.data);
    if (type === null) return null;

    try {
        const info = decodeInstructionInfo(type, instruction);
        return { info, type };
    } catch {
        // Even if data decoding fails, returning the type name is still useful
        return { info: {}, type };
    }
}
