// Authority-path trust core shared by the MCP resolver and the explorer's verified-builds UI.
// The frozen-path logic is deliberately NOT shared: the app re-validates hashes and accepts
// non-frozen trusted signers; this package keeps explorer-mcp parity (frozen-only, no re-hash).
import { TRUSTED_SIGNERS } from './config.js';

type VerifiableEntry = { signer: string; is_verified: boolean; on_chain_hash: string };

/**
 * Keeps entries signed by the program authority or a trusted signer, re-validates `is_verified`
 * against the locally computed hash, and orders authority-first then trusted signers.
 * Hash-mismatched entries stay in the list downgraded — pick winners with `.find(e => e.is_verified)`.
 */
export function orderVerifiedEntries<T extends VerifiableEntry>(
    entries: T[],
    programAuthority: string,
    localHash: string,
): T[] {
    const trusted = entries
        .filter(e => e.is_verified && (TRUSTED_SIGNERS[e.signer] !== undefined || e.signer === programAuthority))
        .map(e => ({ ...e, is_verified: localHash === e.on_chain_hash }));

    const hierarchy = [programAuthority, ...Object.keys(TRUSTED_SIGNERS)];
    const bySigner: Record<string, T> = {};
    for (const e of trusted) {
        bySigner[e.signer] = e;
    }
    const ordered: T[] = [];
    for (const signer of hierarchy) {
        const entry = bySigner[signer];
        if (entry) ordered.push(entry);
    }
    return ordered;
}
