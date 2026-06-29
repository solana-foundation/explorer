import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractTables, featuresFromWikiMarkdown, parseIntOrNull, splitCsv, wikiRowToFeature } from '../wiki';

const FIXTURE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/agave-wiki.md'), 'utf8');

describe('extractTables', () => {
    it('should find every pipe-delimited table in the wiki markdown', () => {
        const tables = extractTables(FIXTURE);
        expect(tables).toHaveLength(4);
    });

    it('should parse header columns and rows from the pending-devnet table', () => {
        const tables = extractTables(FIXTURE);
        const devnetTable = tables[2];
        expect(devnetTable.headers).toEqual([
            'Key',
            'SIMD',
            'Agave Version',
            'FD Version',
            'Jito Version',
            'Testnet',
            'Devnet',
            'Description',
            'Owner',
        ]);
        expect(devnetTable.rows).toHaveLength(1);
        expect(devnetTable.rows[0]).toMatchObject({
            Description: 'Dual SIMD feature',
            Devnet: '',
            'Jito Version': 'v0.5.0',
            Key: 'DEVkey1111111111111111111111111111111111111',
            SIMD: '215,216',
            Testnet: '1000',
        });
    });
});

describe('splitCsv', () => {
    it('should split, trim, and drop empties', () => {
        expect(splitCsv('148,153, , 200,')).toEqual(['148', '153', '200']);
    });

    it('should return an empty array for blank input', () => {
        expect(splitCsv('')).toEqual([]);
        expect(splitCsv(undefined)).toEqual([]);
    });
});

describe('parseIntOrNull', () => {
    it('should return null for empty or whitespace strings', () => {
        expect(parseIntOrNull('')).toBeNull();
        expect(parseIntOrNull('  ')).toBeNull();
        expect(parseIntOrNull(undefined)).toBeNull();
    });

    it('should parse decimal integers', () => {
        expect(parseIntOrNull('712')).toBe(712);
        expect(parseIntOrNull(' 1000 ')).toBe(1000);
    });

    it('should return null for non-numeric input', () => {
        expect(parseIntOrNull('TBD')).toBeNull();
    });
});

describe('wikiRowToFeature', () => {
    it('should map the Description column to the feature title', () => {
        const tables = extractTables(FIXTURE);
        const row = tables[1].rows[0];
        const feature = wikiRowToFeature(row, ['https://simd/200']);

        expect(feature).toMatchObject({
            description: '',
            devnet_activation_epoch: 950,
            key: 'MAINkey111111111111111111111111111111111111',
            mainnet_activation_epoch: null,
            min_agave_versions: ['v2.2.0'],
            min_fd_versions: ['v0.6.0'],
            min_jito_versions: [],
            simd_link: ['https://simd/200'],
            simds: ['200'],
            testnet_activation_epoch: 900,
            title: 'Reward full priority fee to validators',
        });
    });

    it('should preserve every comma-separated SIMD entry', () => {
        const tables = extractTables(FIXTURE);
        const row = tables[2].rows[0];
        const feature = wikiRowToFeature(row, ['https://simd/215', 'https://simd/216']);
        expect(feature.simds).toEqual(['215', '216']);
        expect(feature.simd_link).toEqual(['https://simd/215', 'https://simd/216']);
        expect(feature.devnet_activation_epoch).toBeNull();
    });
});

describe('featuresFromWikiMarkdown column assertion', () => {
    it('should throw when a Pending table is missing a required column', () => {
        // Same shape as the fixture, but with "Description" renamed to "Summary" — the
        // class of failure mode we want loudly caught instead of silently producing blank titles.
        const renamed = `## Pending Devnet

| Key | SIMD | Agave Version | FD Version | Jito Version | Testnet | Devnet | Summary | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEVkey1111111111111111111111111111111111111 | 215 | v2.3.0 |  |  | 1000 |  | Renamed column | baz |
`;
        expect(() => featuresFromWikiMarkdown(renamed, new Map())).toThrowError(
            'missing required columns: Description',
        );
    });

    it('should not throw on the synthetic fixture, whose Pending tables carry all required columns', () => {
        expect(() => featuresFromWikiMarkdown(FIXTURE, new Map())).not.toThrow();
    });

    it('should ignore missing columns in non-Pending tables (e.g. Activated, Version Floor)', () => {
        // Only the Pending tables drive feature import, so a different schema in adjacent
        // tables must not block the run.
        const mixed = `## Activated

| Key | Different | Columns |
| --- | --- | --- |
| ABCkey | x | y |

## Pending Mainnet

| Key | SIMD | Agave Version | FD Version | Jito Version | Testnet | Devnet | Description | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MAINkey111111111111111111111111111111111111 | 200 | v2.2.0 |  |  | 900 | 950 | A pending mainnet feature | bar |
`;
        expect(() => featuresFromWikiMarkdown(mixed, new Map())).not.toThrow();
    });
});
