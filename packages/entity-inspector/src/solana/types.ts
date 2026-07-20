// Error types are not ported yet — SourceUnavailableError lives in rpc.ts and lands with the RPC layer (plan Step 3).

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
    rawDataBytes: Uint8Array | null;
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

/** A numeric value that may be represented as a decimal string when it exceeds Number.MAX_SAFE_INTEGER. */
export type SafeNumeric = number | string | null;
