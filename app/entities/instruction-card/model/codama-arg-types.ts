import {
    type AccountDecode,
    type EventDecode,
    getDecodedEntries,
    type InstructionDecode,
    joinPath,
} from '@explorer/idl-decode';
import type { TypeNode } from 'codama';

// Precise display label for a scalar leaf's codama type node — the IDL-tab vocabulary (u64, i32,
// PublicKey, bool) instead of the value-inferred fallback (bignum, number, pubkey, boolean). Returns
// undefined for kinds we don't label precisely, so the caller keeps its existing fallback.
function scalarTypeLabel(node: TypeNode): string | undefined {
    switch (node.kind) {
        case 'numberTypeNode':
            return node.format;
        case 'publicKeyTypeNode':
            return 'PublicKey';
        case 'booleanTypeNode':
            return 'bool';
        case 'stringTypeNode':
            return 'string';
        default:
            return undefined;
    }
}

/**
 * Path-keyed precise type labels for a Codama decode's scalar leaves. `parseCodamaArgs` overlays these
 * onto its value-inferred types so decoded instruction args and events show the IDL's real types
 * (matching production and the IDL tab), falling back to value inference on any miss. Keyed by the
 * dot-joined leaf path (e.g. `'rewardInfos.0.openTime'`).
 */
export function codamaScalarTypeLabels(
    decode: AccountDecode | EventDecode | InstructionDecode,
): ReadonlyMap<string, string> {
    const labels = new Map<string, string>();
    // getDecodedEntries types its input as account|instruction; an event's Codama arm is structurally the
    // same ({ kind, decoded: { path, data } }) and its path ends in an eventNode whose `.data` the walker
    // reads — so it flattens identically to an account.
    for (const entry of getDecodedEntries(decode as AccountDecode | InstructionDecode)) {
        const label = scalarTypeLabel(entry.node);
        if (label) labels.set(joinPath(entry), label);
    }
    return labels;
}
