// Contract tests for the browser-safe verification entry — the list-level semantics the explorer's
// verified-builds UI depends on; the MCP resolver's winner-picking tests cannot observe these
// (a broken list can still yield the right winner).
import { describe, expect, it } from 'vitest';

import { orderVerifiedEntries, TRUSTED_SIGNERS } from '../index.js';

const AUTHORITY = 'test-program-authority';
const UNTRUSTED_SIGNER = 'test-untrusted-signer';
// Any trusted signer from the live config — tests must not hardcode editable policy values.
const [TRUSTED_SIGNER] = Object.keys(TRUSTED_SIGNERS);
const LOCAL_HASH = 'local-hash';

function entry(overrides: Partial<{ signer: string; is_verified: boolean; on_chain_hash: string }>) {
    return { is_verified: true, on_chain_hash: LOCAL_HASH, signer: AUTHORITY, ...overrides };
}

describe('orderVerifiedEntries', () => {
    it('should order the authority entry before trusted-signer entries', () => {
        const ordered = orderVerifiedEntries(
            [entry({ signer: TRUSTED_SIGNER }), entry({ signer: AUTHORITY })],
            AUTHORITY,
            LOCAL_HASH,
        );

        expect(ordered.map(e => e.signer)).toEqual([AUTHORITY, TRUSTED_SIGNER]);
    });

    it('should keep a hash-mismatched entry in the list downgraded to unverified', () => {
        const ordered = orderVerifiedEntries([entry({ on_chain_hash: 'other-hash' })], AUTHORITY, LOCAL_HASH);

        expect(ordered).toHaveLength(1);
        expect(ordered[0].is_verified).toBe(false);
    });

    it('should drop entries from untrusted signers', () => {
        const ordered = orderVerifiedEntries(
            [entry({ signer: UNTRUSTED_SIGNER }), entry({ signer: AUTHORITY })],
            AUTHORITY,
            LOCAL_HASH,
        );

        expect(ordered.map(e => e.signer)).toEqual([AUTHORITY]);
    });

    it('should not resurrect entries the registry marks unverified even when the hash matches', () => {
        expect(orderVerifiedEntries([entry({ is_verified: false })], AUTHORITY, LOCAL_HASH)).toEqual([]);
    });
});
