#!/usr/bin/env -S pnpm exec tsx

/**
 * Fetches verified Solana programs from OSecure, enriches them with
 * IDL-derived names and repo URLs, and writes a compact JSON file.
 *
 * Usage:
 *   MAINNET_RPC_URL=https://... pnpm exec tsx scripts/update-verified-programs.ts
 *
 * Output:
 *   - public/verified-programs.json
 */

import { fetchIdl } from '@solana/idl';
import { address, createSolanaRpc } from '@solana/kit';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { array, create, type Infer, optional, refine, string, type } from 'superstruct';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../public/verified-programs.json');

const OSEC_BASE = 'https://verify.osec.io';
const RPC_URL = process.env.MAINNET_RPC_URL;

if (!RPC_URL) {
    console.error('MAINNET_RPC_URL environment variable is required');
    process.exit(1);
}

interface OSecPage {
    meta: { total: number; total_pages: number; page: number };
    verified_programs: string[];
}

interface OSecStatus {
    is_verified: boolean;
    repo_url: string;
    last_verified_at: string | undefined;
}

// eslint-disable-next-line no-restricted-syntax -- base58 character-set validation requires a regex
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const Base58Address = refine(
    string(),
    'Base58Address',
    value => BASE58_RE.test(value) || `not a base58 address: ${value}`,
);

const NonEmptyString = refine(string(), 'NonEmptyString', value => value.length > 0 || 'must be non-empty');

const HttpsUrl = refine(string(), 'HttpsUrl', value => {
    try {
        return new URL(value).protocol === 'https:' || `not https: ${value}`;
    } catch {
        return `not a URL: ${value}`;
    }
});

const IsoDateTime = refine(
    string(),
    'IsoDateTime',
    // eslint-disable-next-line no-restricted-syntax -- ISO 8601 datetime validation requires a regex
    value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value) || `not ISO datetime: ${value}`,
);

const VerifiedProgramStruct = type({
    address: Base58Address,
    name: NonEmptyString,
    repoUrl: optional(HttpsUrl),
    verifiedAt: optional(IsoDateTime),
});

const VerifiedProgramsArray = array(VerifiedProgramStruct);

type VerifiedProgram = Infer<typeof VerifiedProgramStruct>;

const STATUS_CONCURRENCY = 2;
const STATUS_RETRIES = 4;
const RETRY_DELAY_MS = 1000;
const CHUNK_DELAY_MS = 300;

main();

async function main() {
    console.log('Fetching verified program addresses from OSecure...');
    const addresses = await fetchAllAddresses();
    console.log(`  Found ${addresses.length} verified programs`);

    console.log('Fetching status for each program...');
    const statuses = await fetchStatuses(addresses);
    console.log(`  Fetched ${statuses.size} statuses`);

    console.log('Fetching IDL names from RPC...');
    const idlNames = await fetchIdlNames(addresses);
    console.log(`  Resolved ${idlNames.size} IDL names`);

    // Only include programs confirmed as verified
    const verifiedAddresses = addresses.filter(addr => statuses.get(addr)?.is_verified === true);
    const skipped = addresses.length - verifiedAddresses.length;
    if (skipped > 0) {
        console.log(`  Excluded ${skipped} programs (unverified or status unavailable)`);
    }

    const programs: VerifiedProgram[] = verifiedAddresses
        .map(addr => {
            const status = statuses.get(addr);
            const idlName = idlNames.get(addr);
            const repoUrl = status?.repo_url || undefined;
            const name = idlName || deriveNameFromRepo(repoUrl) || `${addr.slice(0, 12)}...`;

            return {
                address: addr,
                name,
                repoUrl,
                verifiedAt: status?.last_verified_at?.split('.')[0] ?? undefined,
            };
        })
        .sort((a, b) => a.address.localeCompare(b.address));

    if (programs.length === 0) {
        console.error('\nNo verified programs found -- aborting to avoid overwriting existing data');
        process.exit(1);
    }

    const validated = create(programs, VerifiedProgramsArray);
    await writeFile(OUTPUT_PATH, `${JSON.stringify(validated, undefined, 2)}\n`, 'utf8');
    console.log(`\nWritten ${validated.length} programs to ${OUTPUT_PATH}`);
}

async function fetchAllAddresses(): Promise<string[]> {
    const firstPage = await fetchJson<OSecPage>(`${OSEC_BASE}/verified-programs`);
    const allAddresses = [...firstPage.verified_programs];

    const totalPages = firstPage.meta.total_pages;
    for (let page = 2; page <= totalPages; page++) {
        const data = await fetchJson<OSecPage>(`${OSEC_BASE}/verified-programs/${page}`);
        allAddresses.push(...data.verified_programs);
    }

    const unique = [...new Set(allAddresses)];
    const valid = unique.filter(addr => {
        if (!BASE58_RE.test(addr)) {
            console.warn(`  Skipping invalid address from OSecure: ${addr}`);
            return false;
        }
        return true;
    });
    return valid;
}

async function fetchStatuses(addresses: string[]): Promise<Map<string, OSecStatus>> {
    const results = new Map<string, OSecStatus>();
    const chunks = chunkArray(addresses, STATUS_CONCURRENCY);
    let failures = 0;

    for (let i = 0; i < chunks.length; i++) {
        if (i > 0) await sleep(CHUNK_DELAY_MS);
        const settled = await Promise.allSettled(
            chunks[i].map(async addr => {
                const status = await fetchJsonWithRetry<OSecStatus>(`${OSEC_BASE}/status/${addr}`, STATUS_RETRIES);
                return { addr, status };
            }),
        );
        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.set(result.value.addr, result.value.status);
            } else {
                failures++;
            }
        }
    }

    if (failures > 0) console.log(`  (${failures} status requests failed)`);

    const failRate = failures / addresses.length;
    if (failRate > 0.5) {
        throw new Error(
            `OSecure API too unreliable: ${failures}/${addresses.length} status requests failed (${(failRate * 100).toFixed(0)}%)`,
        );
    }

    return results;
}

const IDL_CONCURRENCY = 5;

function extractIdlName(idl: unknown): string | undefined {
    if (typeof idl !== 'object' || idl === undefined || idl === null) return undefined;
    const obj = idl;
    if ('name' in obj && typeof obj.name === 'string' && obj.name) return obj.name;
    if ('metadata' in obj && typeof obj.metadata === 'object' && obj.metadata !== null) {
        const meta = obj.metadata;
        if ('name' in meta && typeof meta.name === 'string' && meta.name) return meta.name;
    }
    return undefined;
}

async function fetchIdlNames(addresses: string[]): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- @solana/kit requires a branded URL type
    const rpc = createSolanaRpc(RPC_URL as string & { '~solana/rpc-api': unknown });

    const chunks = chunkArray(addresses, IDL_CONCURRENCY);
    for (let i = 0; i < chunks.length; i++) {
        if (i > 0) await sleep(CHUNK_DELAY_MS);
        const settled = await Promise.allSettled(
            chunks[i].map(async addr => {
                const result = await fetchIdl(rpc, address(addr));
                return { addr, name: result ? extractIdlName(result.idl) : undefined };
            }),
        );
        for (const r of settled) {
            if (r.status === 'fulfilled' && r.value.name) {
                names.set(r.value.addr, r.value.name);
            }
        }
    }

    return names;
}

function deriveNameFromRepo(repoUrl: string | undefined): string | undefined {
    if (!repoUrl) return undefined;
    try {
        const url = new URL(repoUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        // GitHub URLs: /org/repo or /org/repo/tree/<ref>
        const org = parts[0];
        // eslint-disable-next-line no-restricted-syntax -- strip .git suffix from repo URLs
        const repo = parts[1]?.replace(/\.git$/, '');
        if (org && repo) return `${org}/${repo}`;
        return repo || undefined;
    } catch {
        return undefined;
    }
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- fetch response.json() returns unknown
    return response.json() as Promise<T>;
}

async function fetchJsonWithRetry<T>(url: string, retries: number): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetchJson<T>(url);
        } catch (err) {
            if (attempt === retries) throw err;
            await sleep(RETRY_DELAY_MS * 2 ** attempt);
        }
    }
    throw new Error('unreachable');
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
