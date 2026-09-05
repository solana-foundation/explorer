import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { featuresFromSchedule } from '../schedule';
import { parseProposals } from '../simd-proposals';

// End-to-end coverage of the schedule/SIMD scrape pipeline against committed
// snapshots of the *real* Agave feature-gate schedule and the real GitHub
// SIMD-proposals listing. The on-chain RPC path is covered separately. Refresh
// the snapshots with `pnpm exec tsx scripts/feature-gates/refresh-test-fixtures.ts`.
const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const realSchedule = JSON.parse(readFileSync(join(FIXTURE_DIR, 'real-agave-schedule.json'), 'utf8'));
const realProposals = parseProposals(JSON.parse(readFileSync(join(FIXTURE_DIR, 'real-simd-proposals.json'), 'utf8')));

const PUBKEY_MIN_LENGTH = 32;
const PUBKEY_MAX_LENGTH = 44;

function isPendingSection(section: string): boolean {
    return section.toLowerCase().startsWith('pending');
}

describe('feature-gate scrape pipeline (real schedule snapshot)', () => {
    const sections = Object.entries<unknown[]>(realSchedule);
    const features = featuresFromSchedule(realSchedule, realProposals);

    it('should parse the real SIMD listing into a non-empty lookup of GitHub URLs', () => {
        expect(realProposals.size).toBeGreaterThan(0);
        for (const url of realProposals.values()) {
            expect(url.startsWith('https://github.com/')).toBe(true);
        }
    });

    it('should find both pending and non-pending sections, so the section filter is exercised', () => {
        const pending = sections.filter(([section]) => isPendingSection(section));
        const other = sections.filter(([section]) => !isPendingSection(section));
        expect(pending.length).toBeGreaterThanOrEqual(1);
        // e.g. the "Fully Activated" section, which must be excluded.
        expect(other.length).toBeGreaterThanOrEqual(1);
    });

    it('should import exactly the rows from the pending sections and nothing else', () => {
        const pendingRows = sections
            .filter(([section]) => isPendingSection(section))
            .reduce((sum, [, rows]) => sum + rows.length, 0);
        expect(features.length).toBeGreaterThan(0);
        expect(features).toHaveLength(pendingRows);
    });

    it('should produce a base58-length feature key for every imported row', () => {
        for (const feature of features) {
            expect(feature.key.length).toBeGreaterThanOrEqual(PUBKEY_MIN_LENGTH);
            expect(feature.key.length).toBeLessThanOrEqual(PUBKEY_MAX_LENGTH);
        }
    });

    it('should leave activation epochs as integers or null, with mainnet never set from the schedule', () => {
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

    // Not asserted here: a multi-SIMD row. Whether one is currently pending is
    // upstream's business — `schedule.spec.ts` covers that mapping on the
    // synthetic fixture instead.
    it('should resolve at least one real SIMD link from the live data', () => {
        expect(features.some(feature => feature.simd_link.some(link => link !== ''))).toBe(true);
    });

    it('should keep simd_link index-aligned with simds on every imported row', () => {
        for (const feature of features) {
            expect(feature.simd_link).toHaveLength(feature.simds.length);
        }
    });
});
