import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    CONFIG_PROGRAM_LABEL,
    NONCE_PROGRAM_LABEL,
    SPL_TOKEN_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSVAR_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
} from '@explorer/parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import { consoleLogger, type InspectorLogger, ns } from '../logger.js';
import { base58Encoder } from '../rpc/codecs.js';
import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    BPF_LOADER_2_PROGRAM_ID,
    BPF_LOADER_PROGRAM_ID,
    FEATURE_PROGRAM_ID,
    LOADER_V4_PROGRAM_ID,
    NATIVE_LOADER_PROGRAM_ID,
    NFTOKEN_ADDRESS,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
} from '../shared/constants.js';
import { asRecord, asString } from '../shared/parse-helpers.js';
import type {
    AccountEntityKind,
    BaseAccountEntityKind,
    DasClassificationOutcome,
    IdentifierKind,
    NormalizedAccountInfo,
    TokenSubtype,
} from './types.js';

const ADDRESS_LOOKUP_TABLE_META_BYTES = 56;
const PUBKEY_BYTES = 32;

export function decodeBase58(value: string, logger: InspectorLogger = consoleLogger): ReadonlyUint8Array | null {
    if (!value) {
        return null;
    }

    try {
        return base58Encoder().encode(value);
    } catch (error) {
        logger.warn(ns('base58 decode of identifier failed'), { error, value });
        return null;
    }
}

export function decodeIdentifierKind(identifier: string, logger: InspectorLogger = consoleLogger): IdentifierKind {
    const decoded = decodeBase58(identifier, logger);
    if (!decoded) {
        return 'invalid';
    }
    if (decoded.length === 32) {
        return 'account';
    }
    if (decoded.length === 64) {
        return 'transaction';
    }
    return 'invalid';
}

function hasAddressLookupTableLayout(rawDataBytes: ReadonlyUint8Array | null): boolean {
    if (!rawDataBytes) {
        return false;
    }
    if (rawDataBytes.length < ADDRESS_LOOKUP_TABLE_META_BYTES) {
        return false;
    }
    const remainingBytes = rawDataBytes.length - ADDRESS_LOOKUP_TABLE_META_BYTES;
    return remainingBytes % PUBKEY_BYTES === 0;
}

export function extractTokenSubtype(parsedData: unknown): TokenSubtype | null {
    const parsedRecord = asRecord(parsedData);
    const subtype = asString(parsedRecord?.type);
    if (!subtype) {
        return null;
    }
    if (subtype === 'mint' || subtype === 'account' || subtype === 'multisig') {
        return subtype;
    }
    return null;
}

// RPC-shared kinds intentionally equal the *_PROGRAM_LABEL strings — enforced by AccountEntityKind's Exclude derivation, not by convention.
export function classifyAccountKindBase(account: NormalizedAccountInfo): BaseAccountEntityKind {
    const parsedProgram = account.parsedProgram;

    if (parsedProgram === BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL) {
        return 'bpf-upgradeable-loader';
    }
    // Legacy/v4 loader programs are not jsonParsed by the RPC — classified by owner instead.
    if (account.owner === BPF_LOADER_PROGRAM_ID) {
        return 'bpf-loader';
    }
    if (account.owner === BPF_LOADER_2_PROGRAM_ID) {
        return 'bpf-loader-2';
    }
    if (account.owner === LOADER_V4_PROGRAM_ID) {
        return 'loader-v4';
    }
    // Native (non-BPF) programs — System, Vote, Stake program accounts etc. — are never jsonParsed.
    if (account.owner === NATIVE_LOADER_PROGRAM_ID) {
        return 'native-program';
    }
    if (parsedProgram === STAKE_PROGRAM_LABEL) {
        return 'stake';
    }
    if (account.owner === NFTOKEN_ADDRESS) {
        return 'nftoken';
    }

    const tokenSubtype = extractTokenSubtype(account.parsedData);
    if (parsedProgram === SPL_TOKEN_PROGRAM_LABEL && tokenSubtype) {
        return `${SPL_TOKEN_PROGRAM_LABEL}:${tokenSubtype}`;
    }
    if (parsedProgram === SPL_TOKEN_2022_PROGRAM_LABEL && tokenSubtype) {
        return `${SPL_TOKEN_2022_PROGRAM_LABEL}:${tokenSubtype}`;
    }

    if (parsedProgram === NONCE_PROGRAM_LABEL) {
        return 'nonce';
    }
    if (parsedProgram === VOTE_PROGRAM_LABEL) {
        return 'vote';
    }
    if (parsedProgram === SYSVAR_PROGRAM_LABEL) {
        return 'sysvar';
    }
    if (parsedProgram === CONFIG_PROGRAM_LABEL) {
        return 'config';
    }
    // Layout heuristic alone false-positives on any account sized 56+n·32 — only trust it under the ALT program's ownership.
    if (
        parsedProgram === ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL ||
        (account.owner === ADDRESS_LOOKUP_TABLE_PROGRAM_ID && hasAddressLookupTableLayout(account.rawDataBytes))
    ) {
        return 'address-lookup-table';
    }
    if (account.owner === FEATURE_PROGRAM_ID) {
        return 'feature';
    }
    if (account.owner === SOLANA_ATTESTATION_SERVICE_PROGRAM_ID) {
        return 'solana-attestation-service';
    }

    return 'unknown';
}

export function normalizeDasOutcome(value: unknown): DasClassificationOutcome | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }

    const compression = asRecord(record.compression);
    const ownership = asRecord(record.ownership);
    const id = asString(record.id) ?? asString(record.assetId) ?? undefined;
    const owner = asString(ownership?.owner) ?? undefined;
    const tree = asString(compression?.tree) ?? undefined;

    const outcome: DasClassificationOutcome = {
        compressed: compression?.compressed === true,
    };
    if (id) {
        outcome.assetId = id;
    }
    if (owner) {
        outcome.owner = owner;
    }
    if (tree) {
        outcome.tree = tree;
    }

    return outcome;
}

export function promoteAccountKindWithDas(
    baseKind: BaseAccountEntityKind,
    dasOutcome: DasClassificationOutcome | null,
): AccountEntityKind {
    if (baseKind !== 'unknown') {
        return baseKind;
    }
    if (dasOutcome?.compressed === true) {
        return 'compressed-nft';
    }
    return 'unknown';
}
