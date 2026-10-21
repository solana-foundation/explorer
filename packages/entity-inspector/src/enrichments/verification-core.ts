import { TRUSTED_SIGNERS } from './config.js';

type VerifiableEntry = { signer: string; is_verified: boolean; on_chain_hash: string };

export async function fetchOsecStatusAll(
    baseUrl: string,
    programAddress: string,
    signal: AbortSignal,
): Promise<unknown> {
    const response = await fetch(`${baseUrl}/status-all/${encodeURIComponent(programAddress)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

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
