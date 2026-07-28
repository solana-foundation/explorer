import type { IdlStandard } from '@explorer/idl-decode';
import type { RpcParsedAccountProgram, TokenProgram } from '@explorer/parsers';
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

export type TransactionVersion = 'legacy' | 0 | null;

export type ResolvedAccount = {
    address: string;
    signer: boolean;
    writable: boolean;
    source: 'static' | 'lookupTable';
    lookupTableAddress?: string;
};

export type AddressTableLookup = {
    accountKey: string;
    writableIndexes: readonly number[];
    readonlyIndexes: readonly number[];
};

export type TransactionProbeEnvelope = {
    slot: number | bigint;
    blockTime: number | bigint | null;
    // kit may deliver the numeric version as bigint; the normalizer narrows it to TransactionVersion.
    version?: 'legacy' | number | bigint | null;
    meta: {
        err: unknown;
        fee: number | bigint;
        computeUnitsConsumed?: number | bigint | null;
        logMessages?: readonly string[] | null;
        innerInstructions?: readonly CompiledInnerInstruction[] | null;
        loadedAddresses?: {
            readonly writable: readonly string[];
            readonly readonly: readonly string[];
        } | null;
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
            addressTableLookups?: readonly AddressTableLookup[];
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
          version: 'v3' | 'v4' | TokenProgram;
          multisig_address: string | null;
          threshold: SafeNumeric;
          members: string[] | null;
      }
    | { status: 'not_multisig' }
    | { status: 'unknown'; reason: 'source_unavailable' };

// Derived from @explorer/idl-decode's detection vocabulary; the extra members are the source
// explorer-mcp's wider wire vocabulary (legacy converts to codama at client creation; shank is undetectable).
export type IdlType = `${IdlStandard}` | 'anchor_legacy' | 'shank';

export type IdlDiscoveryResult =
    | {
          status: 'found';
          idl_type: IdlType;
          source_type: 'pmp_canonical' | 'anchor_on_chain';
          program_name: string | null;
          // The source shipped the whole IDL json here; deliberately omitted — detection + name serve the tool.
          data?: Record<string, unknown>;
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

type TransactionPayloadContextBase = {
    signature: string;
    slot: number;
    blockTime: SafeNumeric;
    feeLamports: SafeNumeric;
    version: TransactionVersion;
    computeUnitsConsumed: SafeNumeric;
    logMessages: readonly string[] | null;
    recentBlockhash: string | null;
    confirmationStatus: ConfirmationStatus | null;
    confirmations: number | 'max' | null;
    accountKeys: string[];
    resolvedAccounts: ResolvedAccount[];
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
    instructions: readonly CompiledInstruction[];
    innerInstructions: readonly CompiledInnerInstruction[] | null;
};

export type TransactionPayloadContext =
    | (TransactionPayloadContextBase & { status: 'success'; err: null })
    | (TransactionPayloadContextBase & {
          status: 'failed';
          /** Raw error from the RPC response. */
          err: Record<string, unknown> | string | unknown[] | null;
      })
    | (TransactionPayloadContextBase & { status: 'unknown'; err: null });

export type DecodedInstructionSource = 'idl' | 'bundled' | 'raw';

export type DecodedInstructionInfo = {
    /** Decoder-declared program label (e.g. 'spl-token'); omitted when the decoder has none. */
    program?: string;
    type: string;
    info: unknown;
};

type TransactionInstructionEntryBase = {
    program_id: string;
    accounts: string[];
    /** base58-encoded instruction data, as delivered by json-encoded getTransaction. */
    data: string;
    source: DecodedInstructionSource;
    decoded?: DecodedInstructionInfo;
};

export type TransactionInstructionEntry = TransactionInstructionEntryBase & {
    inner_instructions: TransactionInstructionEntryBase[];
};

export type FallbackInstructionAccount = {
    address: string;
    signer: boolean;
    writable: boolean;
};

export type FallbackInstruction = {
    programId: string;
    accounts: FallbackInstructionAccount[];
    /** base58-encoded instruction data. */
    data: string;
};

/** Host-app decoder for programs the package has no built-in support for — `undefined` means "cannot decode". */
export type DecodeInstructionFallback = (instruction: FallbackInstruction) => DecodedInstructionInfo | undefined;

type TransactionPayloadEntityBase = {
    kind: 'transaction';
    signature: string;
    slot: number;
    block_time: SafeNumeric;
    fee_lamports: SafeNumeric;
    signers: string[];
    transaction_version: TransactionVersion;
    recent_blockhash: string | null;
    compute_units_consumed: SafeNumeric;
    confirmation_status: ConfirmationStatus | null;
    confirmations: number | 'max' | null;
    log_messages: readonly string[] | null;
    accounts: ResolvedAccount[];
    instructions: TransactionInstructionEntry[];
};

export type TransactionPayloadOutput = {
    entity:
        | (TransactionPayloadEntityBase & { status: 'success'; error: null })
        | (TransactionPayloadEntityBase & {
              status: 'failed';
              error: Record<string, unknown> | string | unknown[] | null;
          })
        | (TransactionPayloadEntityBase & { status: 'unknown'; error: null });
};
