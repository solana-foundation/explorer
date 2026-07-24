import {
    containsBytes,
    type Encoder,
    getBase16Encoder,
    getBase58Encoder,
    getBase64Encoder,
    getI8Encoder,
    getI16Encoder,
    getI32Encoder,
    getI64Encoder,
    getI128Encoder,
    getU8Encoder,
    getU16Encoder,
    getU32Encoder,
    getU64Encoder,
    getU128Encoder,
    getUtf8Encoder,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { type InstructionNode, isNode, type Node, titleCase } from 'codama';

import { isCodamaIdl } from '../detect/index.js';
import { type AnchorIdl, type CodamaIdl, type SupportedIdl } from '../types.js';

export type InstructionNameEntry = {
    discriminator: Uint8Array;
    // Byte offset of the discriminator in the instruction data — 0 for every arm we build today.
    offset: number;
    name: string;
};

// Names only — no arg/account schema — so resolution is a byte-prefix compare, never a Borsh decode.
export type InstructionNameTable = readonly InstructionNameEntry[];

export type InstructionNameResolver = (data: ReadonlyUint8Array) => string | undefined;

/** The program's display name from IDL metadata, title-cased; undefined when the IDL does not name it. */
export function buildProgramName(idl: SupportedIdl): string | undefined {
    const name = isCodamaIdl(idl) ? idl.program?.name : idl.metadata?.name;
    return name ? titleCase(name) : undefined;
}

/** Build a name resolver from the IDL's discriminator table; undefined when no usable table. */
export function buildInstructionNameResolver(idl: SupportedIdl): InstructionNameResolver | undefined {
    const table = buildInstructionNameTable(idl);
    if (table.length === 0) return undefined;
    return data => matchInstructionName(table, data);
}

export function buildInstructionNameTable(idl: SupportedIdl): InstructionNameTable {
    return isCodamaIdl(idl) ? buildCodamaTable(idl) : buildAnchorTable(idl);
}

// TODO: check whether identifyInstructionData (@codama/dynamic-parsers) can replace this local match — today it costs the engine-free entry, converts Anchor docs, and is first-match, not longest-prefix.
// Longest-prefix match (1-byte Codama must not shadow 8-byte Anchor); empty discriminators would match everything, so they are skipped.
export function matchInstructionName(table: InstructionNameTable, data: ReadonlyUint8Array): string | undefined {
    let match: InstructionNameEntry | undefined;
    for (const entry of table) {
        if (
            entry.discriminator.length > 0 &&
            containsBytes(data, entry.discriminator, entry.offset) &&
            (!match || entry.discriminator.length > match.discriminator.length)
        ) {
            match = entry;
        }
    }
    return match?.name;
}

// Anchor: discriminators are explicit byte arrays at the start of the data.
function buildAnchorTable(idl: AnchorIdl): InstructionNameEntry[] {
    // runtime members may lie about the declared shape — an unusable entry is skipped, never a crash
    return (idl.instructions ?? []).flatMap(ix =>
        typeof ix.name === 'string' && Array.isArray(ix.discriminator) && ix.discriminator.length
            ? [{ discriminator: Uint8Array.from(ix.discriminator), name: titleCase(ix.name), offset: 0 }]
            : [],
    );
}

// kit encoders carry their own width + endianness, so there's no format→size lookup to keep in sync.
// Built lazily — module-scope encoder construction would defeat consumer tree-shaking.
let discriminatorEncoders: Record<string, Encoder<bigint | number>> | undefined;
function getDiscriminatorEncoders(): Record<string, Encoder<bigint | number>> {
    return (discriminatorEncoders ??= {
        i16: getI16Encoder(),
        i32: getI32Encoder(),
        i64: getI64Encoder(),
        i128: getI128Encoder(),
        i8: getI8Encoder(),
        u16: getU16Encoder(),
        u32: getU32Encoder(),
        u64: getU64Encoder(),
        u128: getU128Encoder(),
        u8: getU8Encoder(),
    });
}

let bytesEncoders: Record<string, Encoder<string>> | undefined;
function getBytesEncoders(): Record<string, Encoder<string>> {
    return (bytesEncoders ??= {
        base16: getBase16Encoder(),
        base58: getBase58Encoder(),
        base64: getBase64Encoder(),
        utf8: getUtf8Encoder(),
    });
}

function buildCodamaTable(idl: CodamaIdl): InstructionNameEntry[] {
    // detection guarantees `program`; runtime members may still lie — unusable entries are skipped, never a crash
    return (idl.program.instructions ?? []).flatMap(ix => {
        if (typeof ix.name !== 'string') return [];
        const discriminator = codamaDiscriminator(ix);
        return discriminator ? [{ discriminator, name: titleCase(ix.name), offset: 0 }] : [];
    });
}

// Single discriminator at offset 0, as a field default or a constant node — covers PMP int fields
// and the byte defaults rootNodeFromAnchor emits for Anchor discriminators.
function codamaDiscriminator(ix: InstructionNode): Uint8Array | undefined {
    const [node, ...rest] = Array.isArray(ix.discriminators) ? ix.discriminators : [];
    if (!node || rest.length > 0) return undefined;
    if (isNode(node, 'constantDiscriminatorNode')) {
        return node.offset === 0 && node.constant ? valueBytes(node.constant.type, node.constant.value) : undefined;
    }
    if (!isNode(node, 'fieldDiscriminatorNode') || node.offset !== 0) return undefined;
    const arg = Array.isArray(ix.arguments) ? ix.arguments.find(item => item.name === node.name) : undefined;
    return arg && valueBytes(arg.type, arg.defaultValue);
}

function valueBytes(type: Node, value: Node | undefined): Uint8Array | undefined {
    if (isNode(type, 'fixedSizeTypeNode')) return valueBytes(type.type, value);
    if (isNode(type, 'numberTypeNode') && isNode(value, 'numberValueNode')) {
        const bytes = getDiscriminatorEncoders()[type.format]?.encode(value.number);
        return bytes && Uint8Array.from(bytes);
    }
    if (isNode(type, 'bytesTypeNode') && isNode(value, 'bytesValueNode')) {
        const bytes = getBytesEncoders()[value.encoding]?.encode(value.data);
        return bytes && Uint8Array.from(bytes);
    }
    return undefined;
}
