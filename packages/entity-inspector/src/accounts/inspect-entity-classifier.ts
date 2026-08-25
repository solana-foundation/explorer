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
import { hasAddressLookupTableLayout } from '@explorer/parsers/programs/address-lookup-table';
import { AccountDiscriminator, PROGRAM_METADATA_PROGRAM_ADDRESS } from '@solana-program/program-metadata';
import { isAddress, isSignature } from '@solana/kit';

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
import { err, ok, type Result } from '../shared/result.js';
import {
    ACCOUNT_IDENTIFIER_KIND,
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
    STAKE_KIND,
    SYSVAR_KIND,
    TOKEN_SUBTYPES,
    TRANSACTION_IDENTIFIER_KIND,
    UNKNOWN_KIND,
    VOTE_KIND,
} from './kinds.js';
import type {
    AccountEntityKind,
    BaseAccountEntityKind,
    DasClassificationOutcome,
    IdentifierKind,
    NormalizedAccountInfo,
    TokenSubtype,
} from './types.js';

export function decodeIdentifierKind(identifier: string): Result<IdentifierKind> {
    if (isAddress(identifier)) {
        return ok(ACCOUNT_IDENTIFIER_KIND);
    }
    if (isSignature(identifier)) {
        return ok(TRANSACTION_IDENTIFIER_KIND);
    }
    return err(new Error('identifier must decode from base58 to 32 or 64 bytes'));
}

export function extractTokenSubtype(parsedData: unknown): TokenSubtype | null {
    const parsedRecord = asRecord(parsedData);
    const subtype = asString(parsedRecord?.type);
    if (!subtype) {
        return null;
    }
    return TOKEN_SUBTYPES.find(candidate => candidate === subtype) ?? null;
}

// The PMP program owns three account shapes; its leading byte is the program's own AccountDiscriminator.
// An unrecognised or absent byte stays `null` so the caller falls through to `unknown` rather than
// mislabelling a shape this vocabulary does not cover.
function classifyProgramMetadataKind(account: NormalizedAccountInfo): BaseAccountEntityKind | null {
    switch (account.rawDataBytes?.[0]) {
        case AccountDiscriminator.Empty:
            return PROGRAM_METADATA_EMPTY_KIND;
        case AccountDiscriminator.Buffer:
            return PROGRAM_METADATA_BUFFER_KIND;
        case AccountDiscriminator.Metadata:
            return PROGRAM_METADATA_METADATA_KIND;
        default:
            return null;
    }
}

// RPC-shared kinds intentionally equal the *_PROGRAM_LABEL strings — enforced by AccountEntityKind's Exclude derivation, not by convention.
export function classifyAccountKindBase(account: NormalizedAccountInfo): BaseAccountEntityKind {
    const parsedProgram = account.parsedProgram;

    if (parsedProgram === BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL) {
        return BPF_UPGRADEABLE_LOADER_KIND;
    }
    // Legacy/v4 loader programs are not jsonParsed by the RPC — classified by owner instead.
    if (account.owner === BPF_LOADER_PROGRAM_ID) {
        return BPF_LOADER_KIND;
    }
    if (account.owner === BPF_LOADER_2_PROGRAM_ID) {
        return BPF_LOADER_2_KIND;
    }
    if (account.owner === LOADER_V4_PROGRAM_ID) {
        return LOADER_V4_KIND;
    }
    // Native (non-BPF) programs — System, Vote, Stake program accounts etc. — are never jsonParsed.
    if (account.owner === NATIVE_LOADER_PROGRAM_ID) {
        return NATIVE_PROGRAM_KIND;
    }
    if (parsedProgram === STAKE_PROGRAM_LABEL) {
        return STAKE_KIND;
    }
    if (account.owner === NFTOKEN_ADDRESS) {
        return NFTOKEN_KIND;
    }

    const tokenSubtype = extractTokenSubtype(account.parsedData);
    if (parsedProgram === SPL_TOKEN_PROGRAM_LABEL && tokenSubtype) {
        return `${SPL_TOKEN_PROGRAM_LABEL}:${tokenSubtype}`;
    }
    if (parsedProgram === SPL_TOKEN_2022_PROGRAM_LABEL && tokenSubtype) {
        return `${SPL_TOKEN_2022_PROGRAM_LABEL}:${tokenSubtype}`;
    }

    if (parsedProgram === NONCE_PROGRAM_LABEL) {
        return NONCE_KIND;
    }
    if (parsedProgram === VOTE_PROGRAM_LABEL) {
        return VOTE_KIND;
    }
    if (parsedProgram === SYSVAR_PROGRAM_LABEL) {
        return SYSVAR_KIND;
    }
    if (parsedProgram === CONFIG_PROGRAM_LABEL) {
        return CONFIG_KIND;
    }
    // Layout heuristic alone false-positives on any account sized 56+n·32 — only trust it under the ALT program's ownership.
    if (
        parsedProgram === ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL ||
        (account.owner === ADDRESS_LOOKUP_TABLE_PROGRAM_ID && hasAddressLookupTableLayout(account.rawDataBytes))
    ) {
        return ADDRESS_LOOKUP_TABLE_KIND;
    }
    if (account.owner === FEATURE_PROGRAM_ID) {
        return FEATURE_KIND;
    }
    if (account.owner === SOLANA_ATTESTATION_SERVICE_PROGRAM_ID) {
        return SOLANA_ATTESTATION_SERVICE_KIND;
    }
    if (account.owner === PROGRAM_METADATA_PROGRAM_ADDRESS) {
        const programMetadataKind = classifyProgramMetadataKind(account);
        if (programMetadataKind) {
            return programMetadataKind;
        }
    }

    return UNKNOWN_KIND;
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
    if (baseKind !== UNKNOWN_KIND) {
        return baseKind;
    }
    if (dasOutcome?.compressed === true) {
        return COMPRESSED_NFT_KIND;
    }
    return UNKNOWN_KIND;
}
