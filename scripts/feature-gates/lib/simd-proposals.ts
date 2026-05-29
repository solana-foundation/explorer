const PROPOSALS_URL = 'https://api.github.com/repos/solana-foundation/solana-improvement-documents/contents/proposals';

export type GithubContent = {
    name: string;
    html_url: string;
};

/**
 * Fetch the list of SIMD proposals from the GitHub Contents API and build
 * a `simd_number -> html_url` lookup. Keys are zero-padded to 4 digits
 * (matching the `0148-foo.md` filename prefix convention).
 */
export async function fetchSimdProposals(): Promise<Map<string, string>> {
    const response = await fetch(PROPOSALS_URL);
    if (!response.ok) {
        console.warn(`Failed to fetch SIMD proposals: ${response.status}`);
        return new Map();
    }

    // External GitHub Contents API — trust the documented shape rather than redefining a runtime validator.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- external API response shape
    const items = (await response.json()) as GithubContent[];
    return parseProposals(items);
}

/**
 * Build a `simd_number -> html_url` lookup from the GitHub Contents listing.
 * Keys are the zero-padded 4-digit filename prefix (`0148-foo.md` -> `0148`);
 * entries without such a prefix are ignored.
 */
export function parseProposals(items: GithubContent[]): Map<string, string> {
    const proposals = new Map<string, string>();
    for (const item of items) {
        if (!item.name.endsWith('.md')) continue;
        const prefix = item.name.slice(0, 4);
        // eslint-disable-next-line no-restricted-syntax -- match the 4-digit SIMD prefix
        if (!/^\d{4}$/.test(prefix)) continue;
        proposals.set(prefix, item.html_url);
    }
    return proposals;
}

/**
 * Resolve a comma-separated SIMD list (e.g. `148,153` or `153`) into the
 * matching proposal URLs, preserving order and emitting `''` for entries
 * that aren't recognizable SIMD numbers.
 */
export function resolveSimdLinks(simdCsv: string, proposals: Map<string, string>): string[] {
    return simdCsv.split(',').map(raw => {
        const trimmed = raw.trim();
        // eslint-disable-next-line no-restricted-syntax -- match a numeric SIMD reference
        if (!/^\d+$/.test(trimmed)) return '';
        return proposals.get(trimmed.padStart(4, '0')) ?? '';
    });
}

/**
 * Back-fill `simd_link` entries that are still empty on already-stored rows.
 * Recovery path for the "first cron run hit a GitHub rate-limit" case: a
 * feature was originally appended with `simds: ['337']` but `simd_link: ['']`
 * because the proposals listing fetch failed at that moment. Without this
 * pass, `appendNewFeatures` skips the row on every future run (it's already
 * "known"), so the links stay empty forever. Only empty slots are filled —
 * existing non-empty links are never overwritten.
 */
export function resolveMissingSimdLinks<T extends { simds: string[]; simd_link: string[] }>(
    features: T[],
    proposals: Map<string, string>,
): T[] {
    if (proposals.size === 0) return features;
    let healed = 0;
    const result = features.map(feature => {
        if (feature.simds.length === 0) return feature;
        const lengthMismatch = feature.simd_link.length !== feature.simds.length;
        const hasEmptySlot = feature.simd_link.some(link => link.length === 0);
        if (!lengthMismatch && !hasEmptySlot) return feature;

        const resolved = resolveSimdLinks(feature.simds.join(','), proposals);
        const merged = feature.simds.map((_, index) => {
            const existing = feature.simd_link[index] ?? '';
            return existing.length > 0 ? existing : (resolved[index] ?? '');
        });
        if (merged.every((link, index) => link === (feature.simd_link[index] ?? ''))) return feature;
        healed += 1;
        return { ...feature, simd_link: merged };
    });
    if (healed > 0) console.log(`Back-filled simd_link for ${healed} feature(s).`);
    return result;
}
