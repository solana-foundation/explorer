import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseProposals } from '../simd-proposals';
import { extractTables, featuresFromWikiMarkdown } from '../wiki';

// End-to-end coverage of the wiki/SIMD scrape pipeline against committed
// snapshots of the *real* Agave Feature-Gate-Tracker wiki and the real GitHub
// SIMD-proposals listing. The on-chain RPC path is covered separately. Refresh
// the snapshots with `pnpm exec tsx scripts/feature-gates/refresh-test-fixtures.ts`.
const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const realWiki = readFileSync(join(FIXTURE_DIR, 'real-agave-wiki.md'), 'utf8');
const realProposals = parseProposals(JSON.parse(readFileSync(join(FIXTURE_DIR, 'real-simd-proposals.json'), 'utf8')));

const PUBKEY_MIN_LENGTH = 32;
const PUBKEY_MAX_LENGTH = 44;

function isPendingHeading(heading: string | undefined): boolean {
    return heading?.toLowerCase().startsWith('pending') ?? false;
}

describe('feature-gate scrape pipeline (real wiki snapshot)', () => {
    const tables = extractTables(realWiki);
    const features = featuresFromWikiMarkdown(realWiki, realProposals);

    it('should parse the real SIMD listing into a non-empty lookup of GitHub URLs', () => {
        expect(realProposals.size).toBeGreaterThan(0);
        for (const url of realProposals.values()) {
            expect(url.startsWith('https://github.com/')).toBe(true);
        }
    });

    it('should find both pending and non-pending sections, so the heading filter is exercised', () => {
        const pending = tables.filter(table => isPendingHeading(table.heading));
        const other = tables.filter(table => !isPendingHeading(table.heading));
        expect(pending.length).toBeGreaterThanOrEqual(1);
        // e.g. the "Version Floor" / "Activated" tables, which must be excluded.
        expect(other.length).toBeGreaterThanOrEqual(1);
    });

    it('should import exactly the rows from the pending sections and nothing else', () => {
        const pendingRows = tables
            .filter(table => isPendingHeading(table.heading))
            .reduce((sum, table) => sum + table.rows.length, 0);
        expect(features.length).toBeGreaterThan(0);
        expect(features).toHaveLength(pendingRows);
    });

    it('should produce a base58-length feature key for every imported row', () => {
        for (const feature of features) {
            expect(feature.key.length).toBeGreaterThanOrEqual(PUBKEY_MIN_LENGTH);
            expect(feature.key.length).toBeLessThanOrEqual(PUBKEY_MAX_LENGTH);
        }
    });

    it('should leave activation epochs as integers or null, with mainnet never set from the wiki', () => {
        for (const feature of features) {
            const epochs = [
                feature.devnet_activation_epoch,
                feature.testnet_activation_epoch,
                feature.mainnet_activation_epoch,
            ];
            for (const epoch of epochs) {
                expect(epoch === null || Number.isInteger(epoch)).toBe(true);
            }
            expect(feature.mainnet_activation_epoch).toBeNull();
        }
    });

    it('should resolve every non-empty SIMD link to a GitHub proposal URL', () => {
        for (const feature of features) {
            for (const link of feature.simd_link) {
                if (link === '') continue;
                expect(link.startsWith('https://github.com/')).toBe(true);
            }
        }
    });

    it('should resolve at least one real SIMD link and one multi-SIMD row from the live data', () => {
        expect(features.some(feature => feature.simd_link.some(link => link !== ''))).toBe(true);
        expect(features.some(feature => feature.simds.length >= 2)).toBe(true);
    });
});
