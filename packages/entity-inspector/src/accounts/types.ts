import type { RpcParsedAccountProgram, TokenProgram } from '@explorer/parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import type {
    IdlDiscoveryResult,
    MultisigReferenceResult,
    SecurityMetadataResult,
    VerificationResult,
} from '../enrichments/types.js';
import type { SafeNumeric } from '../shared/types.js';
import type {
    BPF_LOADER_2_KIND,
    BPF_LOADER_KIND,
    COMPRESSED_NFT_KIND,
    FEATURE_KIND,
    LOADER_V4_KIND,
    NATIVE_PROGRAM_KIND,
    NFTOKEN_KIND,
    PROGRAM_METADATA_LABEL,
    ProgramMetadataSubtype,
    SOLANA_ATTESTATION_SERVICE_KIND,
    TokenSubtype,
    UNKNOWN_KIND,
} from './kinds.js';

export type { IdentifierKind, ProgramMetadataSubtype, TokenSubtype } from './kinds.js';

// All jsonParsed account programs except the token pair (those appear only subtyped) — zero re-spelled literals.
type RpcSharedAccountKind = Exclude<RpcParsedAccountProgram, TokenProgram>;

export type AccountEntityKind =
    | RpcSharedAccountKind
    | `${TokenProgram}:${TokenSubtype}`
    | `${typeof PROGRAM_METADATA_LABEL}:${ProgramMetadataSubtype}`
    | typeof BPF_LOADER_KIND
    | typeof BPF_LOADER_2_KIND
    | typeof LOADER_V4_KIND
    | typeof NATIVE_PROGRAM_KIND
    | typeof NFTOKEN_KIND
    | typeof FEATURE_KIND
    | typeof SOLANA_ATTESTATION_SERVICE_KIND
    | typeof COMPRESSED_NFT_KIND
    | typeof UNKNOWN_KIND;

export type BaseAccountEntityKind = Exclude<AccountEntityKind, typeof COMPRESSED_NFT_KIND>;

export type NormalizedProgramDataInfo = {
    authority: string | null;
    slot: SafeNumeric;
};

export type ProgramDataStatus = 'resolved' | 'missing' | 'source_unavailable';

// programData is present iff the status is 'resolved' — keyed on the status so the illegal
// combinations (resolved-without-data, missing-with-data) are unrepresentable.
type ProgramDataResolution =
    | { programDataStatus: 'resolved'; programData: NormalizedProgramDataInfo; programDataRawBase64?: string | null }
    | { programDataStatus: 'missing' | 'source_unavailable'; programData?: undefined; programDataRawBase64?: undefined }
    | { programDataStatus?: undefined; programData?: undefined; programDataRawBase64?: undefined };

export type NormalizedAccountInfo = {
    owner: string | null;
    parsedProgram: string | null;
    parsedData: unknown;
    rawDataBytes: ReadonlyUint8Array | null;
    // The RPC's own base64 payload, kept verbatim so consumers never re-encode rawDataBytes.
    rawDataBase64?: string | null;
    address?: string;
    lamports?: SafeNumeric;
    executable?: boolean;
    programDataAddress?: string | null;
} & ProgramDataResolution;

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
    // Injected label lookup (the host app wires its program registry) — replaces the source's hardcoded PROGRAM_ADDRESS_LABELS map.
    resolveProgramName?: (address: string) => string | undefined;
};
