import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compact, featuresFromSchedule, parseEpoch, type ScheduleEntry, scheduleEntryToFeature } from '../schedule';

const FIXTURE = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/agave-schedule.json'), 'utf8'),
);

const NO_PROPOSALS = new Map<string, string>();

function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
    return {
        Description: null,
        'Devnet Epoch': null,
        'Feature ID': 'MAINkey111111111111111111111111111111111111',
        'Min Agave Versions': ['v2.2.0'],
        'Min FD Versions': [''],
        'Min Jito Versions': [''],
        Owners: [],
        SIMDs: [''],
        'Testnet Epoch': null,
        Title: 'A feature',
        ...overrides,
    };
}

describe('featuresFromSchedule', () => {
    it('should import every pending row and skip the fully-activated section', () => {
        const features = featuresFromSchedule(FIXTURE, NO_PROPOSALS);
        expect(features.map(feature => feature.title)).toEqual([
            'Reward full priority fee to validators',
            'Dual SIMD feature',
            'Future testnet feature',
            'Feature with no SIMD',
        ]);
    });

    it('should resolve SIMD numbers against the proposals listing', () => {
        const features = featuresFromSchedule(
            FIXTURE,
            new Map([
                ['0215', 'https://simd/215'],
                ['0216', 'https://simd/216'],
            ]),
        );
        const dual = features.find(feature => feature.title === 'Dual SIMD feature');
        expect(dual?.simds).toEqual(['215', '216']);
        expect(dual?.simd_link).toEqual(['https://simd/215', 'https://simd/216']);
    });

    it('should tolerate a section carrying a column we do not read', () => {
        // `Min FRD Versions` was added upstream after this parser was written; a new
        // column must never break the nightly cron.
        expect(() => featuresFromSchedule(FIXTURE, NO_PROPOSALS)).not.toThrow();
    });

    it('should throw when a pending row is missing a field the mapper reads', () => {
        // "Title" renamed to "Summary" upstream — the class of failure we want loudly
        // caught instead of silently producing rows with blank titles.
        const withoutTitle: Record<string, unknown> = { ...entry(), Summary: 'renamed' };
        delete withoutTitle.Title;
        expect(() => featuresFromSchedule({ 'Pending Devnet Activation': [withoutTitle] }, NO_PROPOSALS)).toThrowError(
            'Pending schedule section "Pending Devnet Activation" does not match the expected row shape',
        );
    });

    it('should ignore a shape change in a section it never imports', () => {
        const mixed = {
            'Fully Activated': [{ Different: 'columns' }],
            'Pending Devnet Activation': [entry()],
        };
        expect(() => featuresFromSchedule(mixed, NO_PROPOSALS)).not.toThrow();
    });

    it('should throw when no pending section exists at all', () => {
        expect(() => featuresFromSchedule({ 'Fully Activated': [] }, NO_PROPOSALS)).toThrowError(
            'Feature-gate schedule has no "Pending …" section. Found sections: Fully Activated.',
        );
    });

    it('should throw when the document is not a section map', () => {
        expect(() => featuresFromSchedule([entry()], NO_PROPOSALS)).toThrow();
    });
});

describe('scheduleEntryToFeature', () => {
    it('should map schedule columns onto the on-disk feature shape', () => {
        const feature = scheduleEntryToFeature(
            entry({
                Description: 'A long-form description.',
                'Devnet Epoch': 950,
                'Min FD Versions': ['v0.6.0'],
                Owners: ['bar'],
                SIMDs: ['200'],
                'Testnet Epoch': 900,
                Title: '  Reward full priority fee to validators  ',
            }),
            ['https://simd/200'],
        );

        expect(feature).toEqual({
            comms_required: null,
            description: 'A long-form description.',
            devnet_activation_epoch: 950,
            key: 'MAINkey111111111111111111111111111111111111',
            mainnet_activation_epoch: null,
            min_agave_versions: ['v2.2.0'],
            min_fd_versions: ['v0.6.0'],
            min_jito_versions: [],
            owners: ['bar'],
            planned_testnet_order: null,
            simd_link: ['https://simd/200'],
            simds: ['200'],
            testnet_activation_epoch: 900,
            title: 'Reward full priority fee to validators',
        });
    });

    it('should leave the description empty when upstream has none, for later SIMD back-fill', () => {
        expect(scheduleEntryToFeature(entry({ Description: null }), []).description).toBe('');
    });

    it('should never set the mainnet epoch, which only on-chain reads provide', () => {
        expect(
            scheduleEntryToFeature(entry({ 'Devnet Epoch': 1, 'Testnet Epoch': 2 }), []).mainnet_activation_epoch,
        ).toBeNull();
    });

    it('should keep simd_link empty rather than index-misaligned when the row has no SIMD', () => {
        const feature = scheduleEntryToFeature(entry({ SIMDs: [''] }), ['']);
        expect(feature.simds).toEqual([]);
        expect(feature.simd_link).toEqual([]);
    });
});

describe('parseEpoch', () => {
    it('should pass numbers through', () => {
        expect(parseEpoch(712)).toBe(712);
    });

    it('should treat the blank cell spellings as no epoch', () => {
        expect(parseEpoch(null)).toBeNull();
        expect(parseEpoch('')).toBeNull();
        expect(parseEpoch('   ')).toBeNull();
    });

    it('should parse a numeric string and reject anything else', () => {
        expect(parseEpoch(' 1000 ')).toBe(1000);
        expect(parseEpoch('TBD')).toBeNull();
    });
});

describe('compact', () => {
    it('should trim entries and drop the blanks upstream uses for "no value"', () => {
        expect(compact([' v1.0 ', '', '  ', 'v2.0'])).toEqual(['v1.0', 'v2.0']);
        expect(compact([''])).toEqual([]);
    });
});
