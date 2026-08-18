import { parseRpcEndpoint } from '@entities/cluster';

/**
 * The name is free text on a fixed-width pill. Left uncapped, a pasted URL or a wall of text becomes an
 * entry that truncates to nothing readable. 48 characters clears the longest provider hostnames — the
 * value `suggestClusterName` produces — so the generated default is never the thing that gets cut.
 */
export const MAX_CLUSTER_NAME_LENGTH = 48;

/**
 * The one place a name is put into its stored form. The save form and the storage reader both call it, so
 * storage cannot hold a name the form could never produce.
 *
 * Trimmed twice: the cap can cut mid-word and leave the trailing space behind.
 */
export function normalizeClusterName(value: string): string {
    return value.trim().slice(0, MAX_CLUSTER_NAME_LENGTH).trim();
}

/**
 * What the name field starts with when the save form opens: the host, not the URL. Provider endpoints
 * carry the API key in the path or the query, and this panel gets opened during screen shares — the same
 * reason the saved list shows a host line rather than an `href`.
 *
 * Two endpoints on one host differ only in that hidden path or query, so their default names collide, and
 * a repeated name replaces the earlier entry rather than adding one. The counter keeps a save from being
 * a silent overwrite.
 *
 * Empty when the field does not hold an endpoint yet, which the form reports as a missing name.
 */
export function suggestClusterName(url: string, takenNames: readonly string[]): string {
    const endpoint = parseRpcEndpoint(url);
    if (!endpoint) return '';
    const base = normalizeClusterName(endpoint.host);
    const taken = new Set(takenNames);
    let candidate = base;
    // Terminates: each counter produces a distinct name, and `taken` is finite.
    for (let n = 2; taken.has(candidate); n++) candidate = withCounter(base, n);
    return candidate;
}

// The counter has to survive the cap, so the base gives way to it rather than the other way round.
function withCounter(base: string, n: number): string {
    const suffix = ` (${n})`;
    return `${base.slice(0, MAX_CLUSTER_NAME_LENGTH - suffix.length).trim()}${suffix}`;
}
