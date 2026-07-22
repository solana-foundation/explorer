import {
    type AnchorIdl,
    type CodamaIdl,
    IdlStandard,
    type IdlVersion,
    type AnchorV00Idl,
    type SupportedIdl,
} from '../types.js';

// A supported IDL always names its program — a missing/blank address flags a malformed IDL early.
const isNonEmptyAddress = (value: unknown, emptyAddress = ''): value is string =>
    typeof value === 'string' && value.trim() !== emptyAddress;

/** Modern Anchor (>= 0.30) declares `metadata.spec`; legacy Anchor has none and is not supported here. */
export function isAnchorIdl(value: unknown): value is AnchorIdl {
    if (typeof value !== 'object' || value === null) return false;
    if (!('address' in value) || !('metadata' in value) || !('instructions' in value)) return false;
    const { address, instructions, metadata } = value;
    return (
        isNonEmptyAddress(address) &&
        typeof metadata === 'object' &&
        metadata !== null &&
        'spec' in metadata &&
        typeof metadata.spec === 'string' &&
        Array.isArray(instructions)
    );
}

/** A Codama IDL is a `RootNode`. */
export function isCodamaIdl(value: unknown): value is CodamaIdl {
    if (typeof value !== 'object' || value === null) return false;
    return (
        'kind' in value &&
        value.kind === 'rootNode' &&
        'program' in value &&
        typeof value.program === 'object' &&
        value.program !== null &&
        'publicKey' in value.program &&
        isNonEmptyAddress(value.program.publicKey)
    );
}

export function isSupportedIdl(value: unknown): value is SupportedIdl {
    return isCodamaIdl(value) || isAnchorIdl(value);
}

/** A legacy (spec 00, pre-0.30) Anchor IDL — the client converts it at creation (program address required). */
export function isLegacyAnchorIdl(value: unknown): value is AnchorV00Idl {
    if (isSupportedIdl(value)) return false;
    if (typeof value !== 'object' || value === null) return false;
    if (!('name' in value) || !('version' in value) || !('instructions' in value)) return false;
    return typeof value.name === 'string' && typeof value.version === 'string' && Array.isArray(value.instructions);
}

export function getIdlStandard(idl: SupportedIdl): IdlStandard {
    return isCodamaIdl(idl) ? IdlStandard.Codama : IdlStandard.Anchor;
}

// Codama root nodes carry the program id at `program.publicKey`; modern Anchor IDLs at the top-level `address`.
export function getIdlProgramAddress(idl: SupportedIdl): string | undefined {
    return (isCodamaIdl(idl) ? idl.program?.publicKey : idl.address) || undefined;
}

// The spec is semver'd independently of anchor releases (anchor-lang-idl-spec) — '0.1.0' for ALL modern anchor.
export function getIdlVersion(idl: SupportedIdl): IdlVersion {
    return isCodamaIdl(idl) ? idl.version : idl.metadata.spec;
}

/** The program's own semver, when the IDL carries one — distinct from the format version. */
export function getIdlProgramVersion(idl: SupportedIdl): string | undefined {
    // `|| undefined` guards runtime IDLs that lie about the fields the types declare as required.
    return (isCodamaIdl(idl) ? idl.program.version : idl.metadata?.version) || undefined;
}
