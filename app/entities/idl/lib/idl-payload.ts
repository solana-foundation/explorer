import { IdlVariant } from '../model/idl-variant';

/**
 * Parse raw on-chain PMP IDL content into a JSON value, or `undefined` when absent/unparseable.
 *
 * `?? undefined` because `JSON.parse` can yield `null` (on-chain content `"null"`); the payload
 * contract is "absent IDL → undefined". Shared by the server route (`/api/idl-latest`) and the
 * client-side resolver so both interpret PMP content identically.
 */
export function parseIdlContent(content?: string): unknown {
    if (!content) return undefined;
    try {
        return JSON.parse(content) ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Pick the IDL tab to show first from on-chain write recency: prefer whichever source was written
 * to chain more recently; tie / unknown → PMP (the newer standard). Shared by the server route and
 * the client-side resolver so known and custom/localhost clusters order tabs identically.
 *
 * Mirrors the legacy `useIdlLastTransactionDate` recency comparison exactly: both slots known →
 * newer wins (tie → PMP); only the Anchor slot known → Anchor; otherwise PMP.
 */
export function pickPreferredVariant(
    hasAnchor: boolean,
    hasPmp: boolean,
    anchorSlot: bigint | undefined,
    pmpSlot: bigint | undefined,
): IdlVariant {
    if (hasAnchor && !hasPmp) return IdlVariant.Anchor;
    if (!hasAnchor) return IdlVariant.ProgramMetadata;

    if (anchorSlot !== undefined && pmpSlot !== undefined) {
        return anchorSlot > pmpSlot ? IdlVariant.Anchor : IdlVariant.ProgramMetadata;
    }
    if (anchorSlot !== undefined) return IdlVariant.Anchor;
    return IdlVariant.ProgramMetadata;
}
