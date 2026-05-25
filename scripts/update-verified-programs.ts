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

import { address, createSolanaRpc } from '@solana/kit';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
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
    last_verified_at: string | null;
}

interface VerifiedProgram {
    address: string;
    name: string;
    repoUrl: string | null;
    verifiedAt: string | null;
}

const STATUS_CONCURRENCY = 5;
const STATUS_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
            const repoUrl = status?.repo_url || null;
            const name = idlName || deriveNameFromRepo(repoUrl) || addr.slice(0, 12) + '...';

            return {
                address: addr,
                name,
                repoUrl: repoUrl || null,
                verifiedAt: status?.last_verified_at?.split('.')[0] ?? null,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    if (programs.length === 0) {
        console.error('\nNo verified programs found -- aborting to avoid overwriting existing data');
        process.exit(1);
    }

    await writeFile(OUTPUT_PATH, JSON.stringify(programs, null, 2) + '\n', 'utf8');
    console.log(`\nWritten ${programs.length} programs to ${OUTPUT_PATH}`);
}

async function fetchAllAddresses(): Promise<string[]> {
    const firstPage: OSecPage = await fetchJson(`${OSEC_BASE}/verified-programs`);
    const allAddresses = [...firstPage.verified_programs];

    const totalPages = firstPage.meta.total_pages;
    for (let page = 2; page <= totalPages; page++) {
        const data: OSecPage = await fetchJson(`${OSEC_BASE}/verified-programs/${page}`);
        allAddresses.push(...data.verified_programs);
    }

    return [...new Set(allAddresses)];
}

async function fetchStatuses(addresses: string[]): Promise<Map<string, OSecStatus>> {
    const results = new Map<string, OSecStatus>();
    const chunks = chunkArray(addresses, STATUS_CONCURRENCY);
    let failures = 0;

    for (const chunk of chunks) {
        const settled = await Promise.allSettled(
            chunk.map(async addr => {
                const status = await fetchJsonWithRetry<OSecStatus>(
                    `${OSEC_BASE}/status/${addr}`,
                    STATUS_RETRIES
                );
                return { addr, status };
            })
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
            `OSecure API too unreliable: ${failures}/${addresses.length} status requests failed (${(failRate * 100).toFixed(0)}%)`
        );
    }

    return results;
}

const IDL_CONCURRENCY = 10;

async function fetchIdlNames(addresses: string[]): Promise<Map<string, string>> {
    const { fetchIdl } = await import('@solana/idl');
    const names = new Map<string, string>();
    const rpc = createSolanaRpc(RPC_URL!);

    const chunks = chunkArray(addresses, IDL_CONCURRENCY);
    for (const chunk of chunks) {
        const settled = await Promise.allSettled(
            chunk.map(async addr => {
                const result = await fetchIdl(rpc, address(addr));
                if (!result) return { addr, name: null };

                let name: string | null = null;
                const idl = result.idl;
                if (typeof idl === 'object' && idl !== null) {
                    name = (idl as Record<string, unknown>).name as string
                        || ((idl as Record<string, unknown>).metadata as Record<string, unknown>)?.name as string
                        || null;
                }
                return { addr, name };
            })
        );
        for (const r of settled) {
            if (r.status === 'fulfilled' && r.value.name) {
                names.set(r.value.addr, r.value.name);
            }
        }
    }

    return names;
}

function deriveNameFromRepo(repoUrl: string | null): string | null {
    if (!repoUrl) return null;
    try {
        const url = new URL(repoUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        // GitHub URLs: /org/repo or /org/repo/tree/<ref>
        const org = parts[0];
        const repo = parts[1]?.replace(/\.git$/, '');
        if (org && repo) return `${org}/${repo}`;
        return repo || null;
    } catch {
        return null;
    }
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json() as Promise<T>;
}

async function fetchJsonWithRetry<T>(url: string, retries: number): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetchJson<T>(url);
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        }
    }
    throw new Error('unreachable');
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
