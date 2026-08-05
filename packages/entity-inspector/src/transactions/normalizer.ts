// Ported from the solana-mcp-official fork (feat/account-resolver) — validates the probe's message
// integrity before index resolution so a malformed RPC response fails loudly, not with wrong data.
import { type InspectorLogger, ns } from '../logger.js';
import { asRecord, asSafeNumeric } from '../shared/parse-helpers.js';
import { err, ok, type Result } from '../shared/result.js';
import type {
    CompiledInnerInstruction,
    CompiledInstruction,
    ConfirmationStatus,
    SignatureStatusEnvelope,
    SignatureStatusValue,
    TransactionProbeEnvelope,
} from '../rpc/types.js';
import type { TransactionPayloadContext, TransactionVersion } from './types.js';
import { selectAccountResolver } from './account-resolver.js';

function toAccountKeyString(accountKey: string | { pubkey: string }): string {
    if (typeof accountKey === 'string') {
        return accountKey;
    }
    if (typeof accountKey?.pubkey === 'string') {
        return accountKey.pubkey;
    }
    throw new Error(
        `Unexpected transaction probe: accountKey is not a string or {pubkey: string}: ${JSON.stringify(accountKey)}`,
    );
}

function validateInstructionIndices(
    instructions: readonly CompiledInstruction[],
    accountKeyCount: number,
    label: string,
): void {
    for (const ix of instructions) {
        if (
            ix.programIdIndex < 0 ||
            ix.programIdIndex >= accountKeyCount ||
            ix.accounts.some(idx => idx < 0 || idx >= accountKeyCount)
        ) {
            throw new Error(
                `Unexpected transaction probe: ${label} index out of bounds (programIdIndex=${ix.programIdIndex}, accounts=[${ix.accounts.join(',')}], accountKeyCount=${accountKeyCount}).`,
            );
        }
    }
}

function validateHeaderIntegrity(
    header: {
        numRequiredSignatures: number;
        numReadonlySignedAccounts: number;
        numReadonlyUnsignedAccounts: number;
    },
    staticKeyCount: number,
): void {
    const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = header;

    if (numRequiredSignatures <= 0 || numRequiredSignatures > staticKeyCount) {
        throw new Error(
            `Unexpected transaction probe: numRequiredSignatures (${numRequiredSignatures}) out of range for ${staticKeyCount} account keys.`,
        );
    }

    if (numReadonlySignedAccounts < 0 || numReadonlyUnsignedAccounts < 0) {
        throw new Error(
            `Unexpected transaction probe: negative readonly account count (signed=${numReadonlySignedAccounts}, unsigned=${numReadonlyUnsignedAccounts}).`,
        );
    }

    if (
        numReadonlySignedAccounts >= numRequiredSignatures ||
        numReadonlyUnsignedAccounts > staticKeyCount - numRequiredSignatures
    ) {
        throw new Error(
            `Unexpected transaction probe: readonly counts (signed=${numReadonlySignedAccounts}, unsigned=${numReadonlyUnsignedAccounts}) exceed available accounts (signers=${numRequiredSignatures}, total=${staticKeyCount}).`,
        );
    }
}

function validateInstructionIntegrity(
    instructions: readonly CompiledInstruction[],
    innerInstructions: readonly CompiledInnerInstruction[] | null,
    totalKeyCount: number,
): void {
    validateInstructionIndices(instructions, totalKeyCount, 'instruction');

    if (innerInstructions) {
        for (const group of innerInstructions) {
            if (group.index < 0 || group.index >= instructions.length) {
                throw new Error(
                    `Unexpected transaction probe: inner instruction group index (${group.index}) out of bounds for ${instructions.length} instructions.`,
                );
            }
            validateInstructionIndices(group.instructions, totalKeyCount, 'inner instruction');
        }
    }
}

// Only legacy and v0 exist on-chain, and the RPC layer requests maxSupportedTransactionVersion 0.
function normalizeVersion(rawVersion: 'legacy' | number | bigint | null | undefined): TransactionVersion {
    if (rawVersion === 'legacy' || rawVersion === null || rawVersion === undefined) {
        return rawVersion ?? null;
    }
    const version = typeof rawVersion === 'bigint' ? Number(rawVersion) : rawVersion;
    if (version !== 0) {
        throw new Error(`Unexpected transaction probe: unsupported transaction version (${String(rawVersion)}).`);
    }
    return version;
}

function isKnownConfirmationStatus(value: string): value is ConfirmationStatus {
    return value === 'processed' || value === 'confirmed' || value === 'finalized';
}

function parseConfirmationStatus(raw: string | null): Result<ConfirmationStatus | null> {
    if (raw === null) return ok(null);
    if (isKnownConfirmationStatus(raw)) return ok(raw);
    return err(new Error(`unknown confirmation status: ${raw}`));
}

function normalizeConfirmation(
    statusValue: SignatureStatusValue | null,
    confirmationStatus: ConfirmationStatus | null,
): {
    confirmationStatus: ConfirmationStatus | null;
    confirmations: number | 'max' | null;
} {
    const rawConfirmations = statusValue?.confirmations ?? null;
    if (confirmationStatus === 'finalized') {
        return { confirmationStatus, confirmations: 'max' };
    }
    if (typeof rawConfirmations === 'bigint') {
        // Confirmation count is bounded by MAX_LOCKOUT_HISTORY (32), safe to convert directly.
        return { confirmationStatus, confirmations: Number(rawConfirmations) };
    }
    if (typeof rawConfirmations === 'number') {
        return { confirmationStatus, confirmations: rawConfirmations };
    }
    return { confirmationStatus, confirmations: null };
}

// Callers guarantee a non-null err (the success/unknown arms never reach here).
function normalizeTransactionError(rawErr: unknown): Result<Record<string, unknown> | string | unknown[]> {
    if (typeof rawErr === 'string') {
        return ok(rawErr);
    }
    if (Array.isArray(rawErr)) {
        return ok(rawErr);
    }
    const record = asRecord(rawErr);
    if (record) {
        return ok(record);
    }
    return err(new Error(`unrecognized err shape: ${String(rawErr)}`));
}

export function normalizeTransactionProbe(
    signature: string,
    envelope: TransactionProbeEnvelope,
    signatureStatus: SignatureStatusEnvelope | null | undefined,
    logger: InspectorLogger,
): TransactionPayloadContext | null {
    if (envelope === null) {
        return null;
    }

    const slot = asSafeNumeric(envelope.slot);
    if (typeof slot !== 'number') {
        throw new Error('Unexpected transaction probe: slot is not a safe number.');
    }

    const { header, accountKeys } = envelope.transaction.message;
    const instructions = Array.from(envelope.transaction.message.instructions ?? []);
    const meta = envelope.meta;
    const innerInstructions = meta?.innerInstructions ? Array.from(meta.innerInstructions) : null;

    const staticKeys = accountKeys.map(toAccountKeyString);
    validateHeaderIntegrity(header, staticKeys.length);

    const version = normalizeVersion(envelope.version);
    const resolver = selectAccountResolver(version);
    const {
        accountKeys: allKeys,
        lookupCountsMismatch,
        resolvedAccounts,
    } = resolver({
        addressTableLookups: envelope.transaction.message.addressTableLookups,
        header,
        loadedAddresses: meta?.loadedAddresses,
        staticKeys,
    });
    if (lookupCountsMismatch) {
        logger.warn(ns('address table lookup counts do not cover the loaded addresses'), { signature });
    }

    validateInstructionIntegrity(instructions, innerInstructions, allKeys.length);

    const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = header;

    const computeUnitsConsumed = meta ? asSafeNumeric(meta.computeUnitsConsumed ?? null) : null;
    const logMessages = meta?.logMessages ? Array.from(meta.logMessages) : null;
    const recentBlockhash = envelope.transaction.message.recentBlockhash ?? null;

    const statusValue = signatureStatus?.value ?? null;
    const rawStatus = statusValue?.confirmationStatus ?? null;
    const [statusError, parsedStatus] = parseConfirmationStatus(rawStatus);
    if (statusError) {
        logger.warn(ns('transaction normalizer: unknown confirmation status'), {
            signature,
            value: rawStatus,
        });
    }
    const { confirmationStatus, confirmations } = normalizeConfirmation(statusValue, parsedStatus ?? null);

    const base = {
        accountKeys: allKeys,
        blockTime: asSafeNumeric(envelope.blockTime),
        computeUnitsConsumed,
        confirmationStatus,
        confirmations,
        feeLamports: meta ? asSafeNumeric(meta.fee) : null,
        innerInstructions,
        instructions,
        logMessages,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts,
        numRequiredSignatures,
        recentBlockhash,
        resolvedAccounts,
        signature,
        slot,
        version,
    };

    if (meta === null) {
        return { ...base, err: null, status: 'unknown' };
    }
    if (meta.err === null || meta.err === undefined) {
        return { ...base, err: null, status: 'success' };
    }
    const [errShapeError, normalizedError] = normalizeTransactionError(meta.err);
    if (errShapeError) {
        logger.warn(ns('transaction normalizer: unrecognized err shape'), {
            signature,
            value: String(meta.err),
        });
    }
    return { ...base, err: normalizedError ?? String(meta.err), status: 'failed' };
}
