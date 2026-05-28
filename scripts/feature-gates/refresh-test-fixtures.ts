#!/usr/bin/env -S pnpm exec tsx

/**
 * Refresh the committed snapshots used by the scrape-pipeline e2e test:
 *
 *   - `real-agave-wiki.md`        the live Agave Feature-Gate-Tracker wiki page
 *   - `real-simd-proposals.json`  the live GitHub SIMD-proposals listing,
 *                                 trimmed to the `{ name, html_url }` fields
 *                                 the parser actually reads
 *
 * Run after the wiki format changes, then eyeball the diff and re-run the test:
 *   pnpm exec tsx scripts/feature-gates/refresh-test-fixtures.ts
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GithubContent } from './lib/simd-proposals';

const WIKI_URL = 'https://raw.githubusercontent.com/wiki/anza-xyz/agave/Feature-Gate-Tracker-Schedule.md';
const PROPOSALS_URL = 'https://api.github.com/repos/solana-foundation/solana-improvement-documents/contents/proposals';

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'lib/__tests__/fixtures');

async function main() {
    const wiki = await fetchText(WIKI_URL);
    writeFileSync(join(FIXTURE_DIR, 'real-agave-wiki.md'), wiki);
    console.log(`Saved real-agave-wiki.md (${wiki.length} bytes)`);

    const proposals = await fetchProposals();
    writeFileSync(join(FIXTURE_DIR, 'real-simd-proposals.json'), `${JSON.stringify(proposals, undefined, 2)}\n`);
    console.log(`Saved real-simd-proposals.json (${proposals.length} entries)`);
}

async function fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
    }
    return response.text();
}

async function fetchProposals(): Promise<GithubContent[]> {
    const response = await fetch(PROPOSALS_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${PROPOSALS_URL}: HTTP ${response.status}`);
    }
    // External GitHub Contents API — trust the documented shape; keep only the fields the parser reads.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- external API response shape
    const items = (await response.json()) as GithubContent[];
    return items.map(({ name, html_url }) => ({ html_url, name }));
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
