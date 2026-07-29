// TEMPORARY regression pin for the dedupe-app-to-packages plan (phase 3) — DELETE in step 3.4.
// Pins the trust-hierarchy + local re-validation logic inside useVerifiedProgramRegistry (the one
// verified-builds behavior the permanent spec does not cover) before it is replaced by the
// entity-inspector verification core. SWR and cluster are stubbed; hashes are computed with the
// app's own exported hashProgramData so matching/mismatching on_chain_hash values are exact.
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { hashProgramData, type OsecInfo, useVerifiedProgramRegistry } from '../verified-builds';

const holder = vi.hoisted(() => ({ registryData: undefined as unknown }));

vi.mock('swr/immutable', () => ({
    __esModule: true,
    default: vi.fn(() => ({ data: holder.registryData, error: undefined, isLoading: false })),
}));

vi.mock('@providers/cluster', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    // Cluster.MainnetBeta — a cluster with a registry URL so the hook proceeds
    useCluster: () => ({ cluster: 0 }),
}));

const AUTHORITY = new PublicKey('GvV5wLdBpUAaU4EJmzTV2K1DiZPtabAeYLLZXofrr8Qo');
const FOUNDATION_SIGNER = '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r';
const UNTRUSTED_SIGNER = new PublicKey('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T').toBase58();

const PROGRAM_DATA = {
    authority: AUTHORITY.toBase58(),
    data: [Buffer.from('deadbeefcafe', 'hex').toString('base64'), 'base64'] as [string, string],
};
const MATCHING_HASH = hashProgramData(PROGRAM_DATA as never);

function entry(overrides: Partial<OsecInfo>): OsecInfo {
    return {
        commit: 'c0ffee',
        executable_hash: MATCHING_HASH,
        is_frozen: false,
        is_verified: true,
        last_verified_at: '2026-01-01T00:00:00Z',
        on_chain_hash: MATCHING_HASH,
        repo_url: 'https://github.com/org/repo',
        signer: AUTHORITY.toBase58(),
        ...overrides,
    };
}

function registryFor(registryData: OsecInfo[], programAuthority: PublicKey | null) {
    holder.registryData = registryData;
    const { result } = renderHook(() =>
        useVerifiedProgramRegistry({
            programAuthority,
            programData: PROGRAM_DATA as never,
            programId: PublicKey.default,
        }),
    );
    return result.current;
}

describe('useVerifiedProgramRegistry — trust hierarchy and re-validation', () => {
    it('should order the authority entry before trusted-signer entries', () => {
        const result = registryFor(
            [entry({ signer: FOUNDATION_SIGNER }), entry({ signer: AUTHORITY.toBase58() })],
            AUTHORITY,
        );

        expect(result.data?.map(e => e.signer)).toEqual([AUTHORITY.toBase58(), FOUNDATION_SIGNER]);
    });

    it('should keep a stale-verified entry but downgrade is_verified on hash mismatch', () => {
        const result = registryFor([entry({ on_chain_hash: 'not-the-local-hash' })], AUTHORITY);

        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].is_verified).toBe(false);
    });

    it('should drop entries from untrusted signers on the authority path', () => {
        const result = registryFor(
            [entry({ signer: UNTRUSTED_SIGNER }), entry({ signer: AUTHORITY.toBase58() })],
            AUTHORITY,
        );

        expect(result.data?.map(e => e.signer)).toEqual([AUTHORITY.toBase58()]);
    });

    it('should drop unverified entries on the authority path before re-validation', () => {
        const result = registryFor([entry({ is_verified: false })], AUTHORITY);

        expect(result.data).toEqual([]);
    });

    it('should trust frozen entries without an authority, earliest verification first', () => {
        const result = registryFor(
            [
                entry({ is_frozen: true, last_verified_at: '2026-03-01T00:00:00Z', signer: UNTRUSTED_SIGNER }),
                entry({ is_frozen: true, last_verified_at: '2026-02-01T00:00:00Z', signer: AUTHORITY.toBase58() }),
            ],
            null,
        );

        expect(result.data?.map(e => e.last_verified_at)).toEqual(['2026-02-01T00:00:00Z', '2026-03-01T00:00:00Z']);
    });

    it('should drop hash-mismatched entries entirely on the no-authority path', () => {
        const result = registryFor(
            [entry({ is_frozen: true, on_chain_hash: 'not-the-local-hash', signer: UNTRUSTED_SIGNER })],
            null,
        );

        expect(result.data).toEqual([]);
    });

    it('should drop non-frozen untrusted entries on the no-authority path', () => {
        const result = registryFor([entry({ is_frozen: false, signer: UNTRUSTED_SIGNER })], null);

        expect(result.data).toEqual([]);
    });
});
