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
