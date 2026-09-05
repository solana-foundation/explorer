import { buildAddressLookupTablePayload } from './account-kinds/address-lookup-table.js';
import { buildBpfLoader2Payload, buildBpfLoaderPayload } from './account-kinds/bpf-loader.js';
import { buildBpfUpgradeableLoaderPayload } from './account-kinds/bpf-upgradeable-loader.js';
import { buildCompressedNftPayload } from './account-kinds/compressed-nft.js';
import { buildConfigPayload } from './account-kinds/config.js';
import { buildFeaturePayload } from './account-kinds/feature.js';
import { buildLoaderV4Payload } from './account-kinds/loader.js';
import { buildNativeProgramPayload } from './account-kinds/native-program.js';
import { buildNftokenPayload } from './account-kinds/nftoken.js';
import { buildNoncePayload } from './account-kinds/nonce.js';
import { buildProgramMetadataPayload } from './account-kinds/program-metadata.js';
import { type AccountKindBuilder, assertUnreachable } from './account-kinds/shared.js';
import { buildSolanaAttestationServicePayload } from './account-kinds/solana-attestation-service.js';
import { buildSplToken2022AccountPayload } from './account-kinds/spl-token-2022-account.js';
import { buildSplToken2022MintPayload } from './account-kinds/spl-token-2022-mint.js';
import { buildSplToken2022MultisigPayload } from './account-kinds/spl-token-2022-multisig.js';
import { buildSplTokenAccountPayload } from './account-kinds/spl-token-account.js';
import { buildSplTokenMintPayload } from './account-kinds/spl-token-mint.js';
import { buildSplTokenMultisigPayload } from './account-kinds/spl-token-multisig.js';
import { buildStakePayload } from './account-kinds/stake.js';
import { buildSysvarPayload } from './account-kinds/sysvar.js';
import { buildUnknownPayload } from './account-kinds/unknown.js';
import { buildVotePayload } from './account-kinds/vote.js';
import {
    ADDRESS_LOOKUP_TABLE_KIND,
    BPF_LOADER_2_KIND,
    BPF_LOADER_KIND,
    BPF_UPGRADEABLE_LOADER_KIND,
    COMPRESSED_NFT_KIND,
    CONFIG_KIND,
    FEATURE_KIND,
    LOADER_V4_KIND,
    NATIVE_PROGRAM_KIND,
    NFTOKEN_KIND,
    NONCE_KIND,
    PROGRAM_METADATA_BUFFER_KIND,
    PROGRAM_METADATA_EMPTY_KIND,
    PROGRAM_METADATA_METADATA_KIND,
    SOLANA_ATTESTATION_SERVICE_KIND,
    SPL_TOKEN_2022_ACCOUNT_KIND,
    SPL_TOKEN_2022_MINT_KIND,
    SPL_TOKEN_2022_MULTISIG_KIND,
    SPL_TOKEN_ACCOUNT_KIND,
    SPL_TOKEN_MINT_KIND,
    SPL_TOKEN_MULTISIG_KIND,
    STAKE_KIND,
    SYSVAR_KIND,
    UNKNOWN_KIND,
    VOTE_KIND,
} from './kinds.js';
import type { AccountEntityKind, AccountPayloadContext } from './types.js';

function selectBuilder(kind: AccountEntityKind): AccountKindBuilder {
    switch (kind) {
        case BPF_UPGRADEABLE_LOADER_KIND:
            return buildBpfUpgradeableLoaderPayload;
        case BPF_LOADER_KIND:
            return buildBpfLoaderPayload;
        case BPF_LOADER_2_KIND:
            return buildBpfLoader2Payload;
        case LOADER_V4_KIND:
            return buildLoaderV4Payload;
        case NATIVE_PROGRAM_KIND:
            return buildNativeProgramPayload;
        case STAKE_KIND:
            return buildStakePayload;
        case NFTOKEN_KIND:
            return buildNftokenPayload;
        case SPL_TOKEN_MINT_KIND:
            return buildSplTokenMintPayload;
        case SPL_TOKEN_ACCOUNT_KIND:
            return buildSplTokenAccountPayload;
        case SPL_TOKEN_MULTISIG_KIND:
            return buildSplTokenMultisigPayload;
        case SPL_TOKEN_2022_MINT_KIND:
            return buildSplToken2022MintPayload;
        case SPL_TOKEN_2022_ACCOUNT_KIND:
            return buildSplToken2022AccountPayload;
        case SPL_TOKEN_2022_MULTISIG_KIND:
            return buildSplToken2022MultisigPayload;
        case NONCE_KIND:
            return buildNoncePayload;
        case VOTE_KIND:
            return buildVotePayload;
        case SYSVAR_KIND:
            return buildSysvarPayload;
        case CONFIG_KIND:
            return buildConfigPayload;
        case ADDRESS_LOOKUP_TABLE_KIND:
            return buildAddressLookupTablePayload;
        case FEATURE_KIND:
            return buildFeaturePayload;
        case SOLANA_ATTESTATION_SERVICE_KIND:
            return buildSolanaAttestationServicePayload;
        case COMPRESSED_NFT_KIND:
            return buildCompressedNftPayload;
        case PROGRAM_METADATA_EMPTY_KIND:
        case PROGRAM_METADATA_BUFFER_KIND:
        case PROGRAM_METADATA_METADATA_KIND:
            return buildProgramMetadataPayload;
        case UNKNOWN_KIND:
            return buildUnknownPayload;
        default:
            return assertUnreachable(kind);
    }
}

export function buildAccountPayloadWithRouter(context: AccountPayloadContext): Record<string, unknown> {
    return selectBuilder(context.kind)(context);
}
