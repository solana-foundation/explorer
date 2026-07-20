import { buildAddressLookupTablePayload } from './account-kinds/address-lookup-table.js';
import { buildCompressedNftPayload } from './account-kinds/compressed-nft.js';
import { buildConfigPayload } from './account-kinds/config.js';
import { buildFeaturePayload } from './account-kinds/feature.js';
import { buildNftokenPayload } from './account-kinds/nftoken.js';
import { buildNoncePayload } from './account-kinds/nonce.js';
import { type AccountKindBuilder, assertUnreachable, buildUnsupportedKindPayload } from './account-kinds/shared.js';
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
import type { AccountEntityKind, AccountPayloadContext } from './types.js';

function selectBuilder(kind: AccountEntityKind): AccountKindBuilder {
    switch (kind) {
        case 'bpf-upgradeable-loader':
            // Full builder exists (see account-kinds/bpf-upgradeable-loader.ts) but its verification/security/idl/multisig enrichments need the idl-parser — routed as unsupported until that PR lands.
            return buildUnsupportedKindPayload;
        case 'stake':
            return buildStakePayload;
        case 'nftoken':
            return buildNftokenPayload;
        case 'spl-token:mint':
            return buildSplTokenMintPayload;
        case 'spl-token:account':
            return buildSplTokenAccountPayload;
        case 'spl-token:multisig':
            return buildSplTokenMultisigPayload;
        case 'spl-token-2022:mint':
            return buildSplToken2022MintPayload;
        case 'spl-token-2022:account':
            return buildSplToken2022AccountPayload;
        case 'spl-token-2022:multisig':
            return buildSplToken2022MultisigPayload;
        case 'nonce':
            return buildNoncePayload;
        case 'vote':
            return buildVotePayload;
        case 'sysvar':
            return buildSysvarPayload;
        case 'config':
            return buildConfigPayload;
        case 'address-lookup-table':
            return buildAddressLookupTablePayload;
        case 'feature':
            return buildFeaturePayload;
        case 'solana-attestation-service':
            return buildSolanaAttestationServicePayload;
        case 'compressed-nft':
            return buildCompressedNftPayload;
        case 'unknown':
            return buildUnknownPayload;
        default:
            return assertUnreachable(kind);
    }
}

export function buildAccountPayloadWithRouter(context: AccountPayloadContext): Record<string, unknown> {
    return selectBuilder(context.kind)(context);
}
