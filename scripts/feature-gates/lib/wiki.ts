/* eslint-disable no-restricted-syntax -- markdown table parsing needs regexes */
/* eslint-disable unicorn/no-null -- null literals match the nullable feature-gate schema fields */
import type { FeatureGateDraft } from '../../../app/entities/feature-gate/server';
import { fetchSimdProposals, resolveSimdLinks } from './simd-proposals';

export type MarkdownTable = {
    heading: string | undefined;
    headers: string[];
    rows: Record<string, string>[];
};

const WIKI_URL = 'https://raw.githubusercontent.com/wiki/anza-xyz/agave/Feature-Gate-Tracker-Schedule.md';
const TABLE_PATTERN = /\|([^\n]+)\|\n\|(?:[: -]+\|)+\n((?:\|[^\n]+\|\n?)*)/g;
const HEADING_PATTERN = /^#{1,6}\s+(.+?)\s*$/gm;

/**
 * Fetch the Agave Feature-Gate-Tracker wiki page and the SIMD proposals listing,
 * then parse them into feature records. Throws if the wiki is unreachable (it's
 * the essential data source); a failed proposals lookup just yields empty links.
 *
 * Returns the proposals map alongside the features so the orchestrator can
 * also use it to back-fill any previously-stored rows whose `simd_link` is
 * still empty (e.g. a feature first scraped during a transient GitHub outage).
 */
export async function fetchWikiFeatures(): Promise<{ features: FeatureGateDraft[]; proposals: Map<string, string> }> {
    const response = await fetch(WIKI_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch wiki: HTTP ${response.status}`);
    }
    const markdown = await response.text();
    const proposals = await fetchSimdProposals();
    return { features: featuresFromWikiMarkdown(markdown, proposals), proposals };
}

// Columns the parser depends on in `wikiRowToFeature`. If the Agave wiki ever
// renames one of these, we want the cron PR to fail loudly with the missing
// header rather than silently emit rows with blank titles/keys/etc.
const REQUIRED_PENDING_COLUMNS = [
    'Key',
    'SIMD',
    'Agave Version',
    'FD Version',
    'Jito Version',
    'Testnet',
    'Devnet',
    'Description',
] as const;

/**
 * Turn the Agave Feature-Gate-Tracker wiki markdown into feature records. Only
 * the "Pending …" sections are imported (the "Activated"/"Version Floor" tables
 * are skipped); selection is by section heading, not table position, so an
 * added or reordered table can't silently shift which rows we pick up.
 */
export function featuresFromWikiMarkdown(markdown: string, proposals: Map<string, string>): FeatureGateDraft[] {
    const features: FeatureGateDraft[] = [];
    for (const table of extractTables(markdown)) {
        if (!isPendingTable(table)) continue;
        assertExpectedColumns(table);
        for (const row of table.rows) {
            features.push(wikiRowToFeature(row, resolveSimdLinks(row['SIMD'] ?? '', proposals)));
        }
    }
    return features;
}

function assertExpectedColumns(table: MarkdownTable): void {
    const missing = REQUIRED_PENDING_COLUMNS.filter(column => !table.headers.includes(column));
    if (missing.length > 0) {
        throw new Error(
            `Pending wiki table "${table.heading}" is missing required columns: ${missing.join(', ')}. ` +
                `Found columns: ${table.headers.join(', ')}.`,
        );
    }
}

/**
 * Extract every Markdown table from a string, tagged with the section heading
 * that immediately precedes it. The pattern intentionally tolerates only
 * standard GitHub-flavored tables (pipe-delimited with a `---` separator row).
 */
export function extractTables(markdown: string): MarkdownTable[] {
    const tables: MarkdownTable[] = [];
    for (const match of markdown.matchAll(TABLE_PATTERN)) {
        const [, headerRow, body] = match;
        if (headerRow === undefined || body === undefined || match.index === undefined) continue;
        tables.push({ heading: precedingHeading(markdown, match.index), ...parseTable(headerRow, body) });
    }
    return tables;
}

function precedingHeading(markdown: string, tableStart: number): string | undefined {
    const headings = [...markdown.slice(0, tableStart).matchAll(HEADING_PATTERN)];
    return headings.at(-1)?.[1];
}

function parseTable(headerRow: string, body: string): { headers: string[]; rows: Record<string, string>[] } {
    const headers = splitCsv(headerRow, '|');

    const rows: Record<string, string>[] = [];
    for (const line of body.trim().split('\n')) {
        if (!line.trim()) continue;
        const cells = line
            .split('|')
            .slice(1, -1)
            .map(cell => cell.trim());
        if (cells.length === 0) continue;
        const row: Record<string, string> = {};
        for (const [index, header] of headers.entries()) {
            row[header] = cells[index] ?? '';
        }
        rows.push(row);
    }

    return { headers, rows };
}

function isPendingTable(table: MarkdownTable): boolean {
    return table.heading?.toLowerCase().startsWith('pending') ?? false;
}

/**
 * Convert a row from the Agave Feature-Gate-Tracker wiki into the on-disk
 * feature shape. The wiki's "Description" column becomes the feature title;
 * the long-form description is empty here and gets back-filled later from
 * the linked SIMD markdown.
 */
export function wikiRowToFeature(row: Record<string, string>, simdLinks: string[]): FeatureGateDraft {
    return {
        comms_required: null,
        description: '',
        devnet_activation_epoch: parseIntOrNull(row['Devnet']),
        key: (row['Key'] ?? '').trim(),
        mainnet_activation_epoch: null,
        min_agave_versions: splitCsv(row['Agave Version']),
        min_fd_versions: splitCsv(row['FD Version']),
        min_jito_versions: splitCsv(row['Jito Version']),
        owners: [],
        planned_testnet_order: null,
        simd_link: simdLinks,
        simds: splitCsv(row['SIMD']),
        testnet_activation_epoch: parseIntOrNull(row['Testnet']),
        title: row['Description'] ?? '',
    };
}

export function splitCsv(value: string | undefined, separator: string = ','): string[] {
    if (!value) return [];
    return value
        .split(separator)
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

export function parseIntOrNull(value: string | undefined): number | null {
    if (value === undefined) return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
}
