import {
    type Encoder,
    getI8Encoder,
    getI16Encoder,
    getI32Encoder,
    getU8Encoder,
    getU16Encoder,
    getU32Encoder,
} from '@solana/kit';
import { type InstructionNode, isNode, titleCase } from 'codama';

import { startsWith } from '@/app/shared/lib/bytes';

import { type AnchorIdl, type CodamaIdl, type SupportedIdl } from '../lib/types';
import { getIdlStandard } from './idl-version';

export type InstructionNameEntry = {
    discriminator: Uint8Array;
    name: string;
};

// Names only — no arg/account schema — so resolution is a byte-prefix compare, never a Borsh decode.
// A flat list scanned per lookup, not a keyed index, so the scan is the whole story.
export type InstructionNameTable = readonly InstructionNameEntry[];

export type InstructionNameResolver = (data: Uint8Array) => string | undefined;

// A program's IDL-derived names: its display name plus an instruction-name resolver. Both come from the
// same fetched IDL set, so they travel together. Either may be absent (an IDL with no metadata name, or
// one with no usable discriminator table).
export type ProgramIdlNames = {
    programName: string | undefined;
    resolveInstructionName: InstructionNameResolver | undefined;
};

// ---------------------------------------------------------------------------
// Resolution: ordered IDLs in, a name resolver out.
// ---------------------------------------------------------------------------

/**
 * Build a program's IDL-derived names — display name and instruction-name resolver — from its IDLs in
 * preference order (program-metadata beats Anchor). Returns undefined when no IDL yields either.
 */
export function buildProgramIdlNames(idls: readonly (SupportedIdl | undefined)[]): ProgramIdlNames | undefined {
    const programName = buildProgramName(idls);
    const resolveInstructionName = buildInstructionNameResolver(idls);
    if (programName === undefined && resolveInstructionName === undefined) return undefined;
    return { programName, resolveInstructionName };
}

/**
 * The program's display name from IDL metadata, title-cased — the first IDL in preference order that
 * carries one wins (program-metadata's `program.name`, else Anchor's `metadata.name`). Undefined when
 * no IDL names the program.
 */
export function buildProgramName(idls: readonly (SupportedIdl | undefined)[]): string | undefined {
    for (const idl of idls) {
        const name = idl && idlProgramName(idl);
        if (name) return titleCase(name);
    }
    return undefined;
}

function idlProgramName(idl: SupportedIdl): string | undefined {
    return getIdlStandard(idl) === 'Codama' ? (idl as CodamaIdl).program?.name : (idl as AnchorIdl).metadata?.name;
}

/**
 * Build a name resolver from a program's IDLs in preference order: the first table that names the
 * instruction wins (so program-metadata beats Anchor), longest-prefix within each table. Returns
 * undefined when no IDL yields a usable table.
 */
export function buildInstructionNameResolver(
    idls: readonly (SupportedIdl | undefined)[],
): InstructionNameResolver | undefined {
    const tables = idls.flatMap(idl => {
        const table = idl ? buildInstructionNameTable(idl) : [];
        return table.length > 0 ? [table] : [];
    });
    if (tables.length === 0) return undefined;
    return data => {
        for (const table of tables) {
            const name = matchInstructionName(table, data);
            if (name !== undefined) return name;
        }
        return undefined;
    };
}

export function buildInstructionNameTable(idl: SupportedIdl): InstructionNameTable {
    return getIdlStandard(idl) === 'Codama' ? buildCodamaTable(idl as CodamaIdl) : buildAnchorTable(idl as AnchorIdl);
}

// Longest-prefix match, so a short discriminator never shadows a longer one (1-byte Codama vs 8-byte Anchor).
// An empty discriminator is skipped: startsWith treats a zero-length prefix as a match for everything,
// which would shadow every real entry. The builders never emit one, but the guard keeps this exported
// matcher safe for any caller that builds a table directly.
export function matchInstructionName(table: InstructionNameTable, data: Uint8Array): string | undefined {
    let match: InstructionNameEntry | undefined;
    for (const entry of table) {
        if (
            entry.discriminator.length > 0 &&
            startsWith(data, entry.discriminator) &&
            (!match || entry.discriminator.length > match.discriminator.length)
        ) {
            match = entry;
        }
    }
    return match?.name;
}

// ---------------------------------------------------------------------------
// Anchor: discriminators are explicit byte arrays.
// ---------------------------------------------------------------------------

function buildAnchorTable(idl: AnchorIdl): InstructionNameEntry[] {
    return (idl.instructions ?? []).flatMap(ix =>
        ix.discriminator?.length
            ? [{ discriminator: Uint8Array.from(ix.discriminator), name: titleCase(ix.name) }]
            : [],
    );
}

// ---------------------------------------------------------------------------
// Codama: discriminators are constant-valued instruction fields.
// ---------------------------------------------------------------------------

// kit encoders carry their own width + endianness, so there's no format→size lookup to keep in sync.
const DISCRIMINATOR_ENCODERS: Record<string, Encoder<number | bigint>> = {
    i16: getI16Encoder(),
    i32: getI32Encoder(),
    i8: getI8Encoder(),
    u16: getU16Encoder(),
    u32: getU32Encoder(),
    u8: getU8Encoder(),
};

function buildCodamaTable(idl: CodamaIdl): InstructionNameEntry[] {
    return (idl.program?.instructions ?? []).flatMap(ix => {
        const discriminator = codamaDiscriminator(ix);
        return discriminator ? [{ discriminator, name: titleCase(ix.name) }] : [];
    });
}

// Only the common case is resolved: a single constant int field discriminator at offset 0
// (program-metadata style). 8-byte Anchor discriminators are byte arrays, matched via the Anchor table.
function codamaDiscriminator(ix: InstructionNode): Uint8Array | undefined {
    const [field, ...rest] = ix.discriminators ?? [];
    if (!field || rest.length > 0 || !isNode(field, 'fieldDiscriminatorNode') || field.offset !== 0) {
        return undefined;
    }
    const arg = ix.arguments.find(arg => arg.name === field.name);
    if (!arg || !isNode(arg.type, 'numberTypeNode') || !isNode(arg.defaultValue, 'numberValueNode')) {
        return undefined;
    }
    const bytes = DISCRIMINATOR_ENCODERS[arg.type.format]?.encode(arg.defaultValue.number);
    return bytes && Uint8Array.from(bytes);
}
