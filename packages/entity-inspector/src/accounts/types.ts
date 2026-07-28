import type { RpcParsedAccountProgram, TokenProgram } from '@explorer/parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import type {
    IdlDiscoveryResult,
    MultisigReferenceResult,
    SecurityMetadataResult,
    VerificationResult,
} from '../enrichments/types.js';
import type { SafeNumeric } from '../shared/types.js';

export type IdentifierKind = 'account' | 'transaction' | 'invalid';

export type TokenSubtype = 'mint' | 'account' | 'multisig';

// All jsonParsed account programs except the token pair (those appear only subtyped) — zero re-spelled literals.
type RpcSharedAccountKind = Exclude<RpcParsedAccountProgram, TokenProgram>;

export type AccountEntityKind =
    | RpcSharedAccountKind
    | `${TokenProgram}:${TokenSubtype}`
    | 'bpf-loader'
    | 'bpf-loader-2'
    | 'loader-v4'
    | 'native-program'
    | 'nftoken'
    | 'feature'
    | 'solana-attestation-service'
    | 'compressed-nft'
    | 'unknown';

export type BaseAccountEntityKind = Exclude<AccountEntityKind, 'compressed-nft'>;

export type NormalizedProgramDataInfo = {
    authority: string | null;
    slot: SafeNumeric;
};

export type ProgramDataStatus = 'resolved' | 'missing' | 'source_unavailable';

export type NormalizedAccountInfo = {
    owner: string | null;
    parsedProgram: string | null;
    parsedData: unknown;
    rawDataBytes: ReadonlyUint8Array | null;
    address?: string;
    lamports?: SafeNumeric;
    executable?: boolean | null;
    programDataAddress?: string | null;
    programData?: NormalizedProgramDataInfo | null;
    programDataStatus?: ProgramDataStatus;
    programDataRawBase64?: string | null;
};

export type DasClassificationOutcome = {
    compressed: boolean;
    assetId?: string;
    owner?: string;
    tree?: string;
};

export type AccountPayloadContext = {
    kind: AccountEntityKind;
    account: NormalizedAccountInfo;
    dasOutcome?: DasClassificationOutcome;
    verificationResult?: VerificationResult;
    securityMetadataResult?: SecurityMetadataResult;
    multisigReferenceResult?: MultisigReferenceResult;
    idlDiscoveryResult?: IdlDiscoveryResult;
    // Injected label lookup (app registry wired in Step 5) — replaces the source's hardcoded PROGRAM_ADDRESS_LABELS map.
    resolveProgramName?: (address: string) => string | undefined;
};
