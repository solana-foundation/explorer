// PMP accounts carry their own header; the generated client owns its layout, so decode through it rather
// than the owner program's IDL — the codama account node does not cover the trailing payload bytes.
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferDecoder,
    getMetadataDecoder,
} from '@solana-program/program-metadata';
import { unwrapOption } from '@solana/kit';

import { PROGRAM_METADATA_BUFFER_KIND, PROGRAM_METADATA_METADATA_KIND } from '../kinds.js';
import { type AccountKindBuilder, resolveProgramAddressLabel } from './shared.js';

// The client's enums carry TS reverse mappings, so the wire name follows the client instead of a
// hand-kept table that could drift from it. The decoder rejects out-of-range values, so this is total.
function enumName(member: string): string {
    return member.toLowerCase();
}

function baseFields(context: Parameters<AccountKindBuilder>[0]) {
    return {
        address: context.account.address ?? null,
        address_label: resolveProgramAddressLabel(context),
        kind: context.kind,
        owner: context.account.owner ?? null,
    };
}

function decodeHeader(context: Parameters<AccountKindBuilder>[0]): Record<string, unknown> {
    const bytes = context.account.rawDataBytes;
    if (!bytes) {
        return {};
    }
    try {
        if (context.kind === PROGRAM_METADATA_METADATA_KIND) {
            const header = getMetadataDecoder().decode(bytes);
            return {
                authority: unwrapOption(header.authority),
                canonical: header.canonical,
                compression: enumName(Compression[header.compression]),
                data_length: header.dataLength,
                data_source: enumName(DataSource[header.dataSource]),
                encoding: enumName(Encoding[header.encoding]),
                format: enumName(Format[header.format]),
                mutable: header.mutable,
                program: header.program,
                seed: header.seed,
            };
        }
        if (context.kind === PROGRAM_METADATA_BUFFER_KIND) {
            const header = getBufferDecoder().decode(bytes);
            return {
                authority: unwrapOption(header.authority),
                canonical: header.canonical,
                data_length: header.data.length,
                program: unwrapOption(header.program),
                seed: header.seed,
            };
        }
    } catch {
        // A truncated or future-shaped account still classifies; only the header fields are lost.
        return {};
    }
    return {};
}

/**
 * Program Metadata (PMP) accounts. The `empty` subtype carries no header past its discriminator, and a
 * header that fails to decode degrades to the base fields rather than dropping the account to `unknown`.
 */
export const buildProgramMetadataPayload: AccountKindBuilder = context => ({
    entity: {
        ...baseFields(context),
        ...decodeHeader(context),
    },
});
