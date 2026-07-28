// Wire shapes as delivered by the JSON-RPC — probe envelopes and the compiled-message primitives they embed.
import type { Commitment } from '@solana/kit';

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

export type ConfirmationStatus = Commitment;

export type SignatureStatusValue = {
    confirmationStatus: ConfirmationStatus | null;
    confirmations: number | bigint | null;
};

export type SignatureStatusEnvelope = {
    value: SignatureStatusValue | null;
};
