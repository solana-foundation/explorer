import type { ReadonlyUint8Array } from '@solana/kit';

export type IdentifierKind = 'account' | 'transaction' | 'invalid';

export type AccountProbeEnvelope = {
    value: {
        owner: string;
        lamports: number | bigint;
        executable: boolean;
        data: { program: string; parsed: unknown } | [string, string];
    } | null;
};

export type CompiledInstruction = {
    programIdIndex: number;
    accounts: readonly number[];
    data: string;
};

export type CompiledInnerInstruction = {
    index: number;
    instructions: readonly CompiledInstruction[];
};

export type TransactionProbeEnvelope = {
    slot: number | bigint;
    blockTime: number | bigint | null;
    version?: 'legacy' | 0 | null;
    meta: {
        err: unknown;
        fee: number | bigint;
        computeUnitsConsumed?: number | bigint | null;
        logMessages?: readonly string[] | null;
        innerInstructions?: readonly CompiledInnerInstruction[] | null;
    } | null;
    transaction: {
        message: {
            header: {
                numRequiredSignatures: number;
                numReadonlySignedAccounts: number;
                numReadonlyUnsignedAccounts: number;
            };
            accountKeys: readonly (string | { pubkey: string })[];
            recentBlockhash?: string;
            instructions: readonly CompiledInstruction[];
        };
    };
} | null;

export type ConfirmationStatus = 'processed' | 'confirmed' | 'finalized';

export type SignatureStatusValue = {
    confirmationStatus: ConfirmationStatus | null;
    confirmations: number | bigint | null;
};

export type SignatureStatusEnvelope = {
    value: SignatureStatusValue | null;
};

export type AccountEntityKind =
    | 'bpf-upgradeable-loader'
    | 'stake'
    | 'nftoken'
    | 'spl-token:mint'
    | 'spl-token:account'
    | 'spl-token:multisig'
    | 'spl-token-2022:mint'
    | 'spl-token-2022:account'
    | 'spl-token-2022:multisig'
    | 'nonce'
    | 'vote'
    | 'sysvar'
    | 'config'
    | 'address-lookup-table'
    | 'feature'
    | 'solana-attestation-service'
    | 'compressed-nft'
    | 'unknown';

export type BaseAccountEntityKind = Exclude<AccountEntityKind, 'compressed-nft'>;

export type TokenSubtype = 'mint' | 'account' | 'multisig';

export type UnknownMarker = {
    value: null;
    status: 'unknown';
    reason: string;
};

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

// Enrichment result shapes live here, not in resolver modules like the source — types are the contract; Step-7 resolvers import them.

export type VerificationEvidence = {
    signer: string;
    signer_label: string | null;
    on_chain_hash: string;
    executable_hash: string;
    last_verified_at: string | null;
    repo_url: string | null;
    is_frozen: boolean;
    message: string;
};

export type VerificationResult =
    | { status: 'verified'; evidence: VerificationEvidence }
    | { status: 'unverified' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'verification_invalid' };

export type SecurityTxtFields = {
    name: string;
    project_url: string;
    contacts: string;
    policy: string;
    preferred_languages: string | null;
    encryption: string | null;
    source_code: string | null;
    source_release: string | null;
    source_revision: string | null;
    auditors: string | null;
    acknowledgements: string | null;
    expiry: string | null;
    logo?: string | null;
    description?: string | null;
    notification?: string | null;
    sdk?: string | null;
    version?: string | null;
};

export type SecurityMetadataResult =
    | {
          status: 'present';
          data: SecurityTxtFields;
          source_type: 'pmp_canonical' | 'embedded_security_txt';
          security_expired?: true;
      }
    | { status: 'missing' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'security_invalid' };

export type MultisigReferenceResult =
    | {
          status: 'is_multisig';
          version: 'v3' | 'v4' | 'spl-token' | 'spl-token-2022';
          multisig_address: string | null;
          threshold: SafeNumeric;
          members: string[] | null;
      }
    | { status: 'not_multisig' }
    | { status: 'unknown'; reason: 'source_unavailable' };

export type IdlType = 'anchor' | 'anchor_legacy' | 'codama' | 'shank';

export type IdlDiscoveryResult =
    | {
          status: 'found';
          idl_type: IdlType;
          source_type: 'pmp_canonical' | 'anchor_on_chain';
          program_name: string | null;
          data: Record<string, unknown>;
      }
    | { status: 'not_found' }
    | { status: 'unknown'; reason: 'source_unavailable' | 'idl_invalid' | 'address_unverified' };

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

/** A numeric value represented as a decimal string when it exceeds Number.MAX_SAFE_INTEGER — String(bigint) is exact, no precision loss. */
export type SafeNumeric = number | string | null;
