import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import type { SupportedCluster } from '../../config.js';
import type { InspectorLogger } from '../../logger.js';
import { hashProgramData } from '../hash-program-data.js';
import type { BuildParams, OtterVerifyDependencies } from '../otter-verify.js';
import { createVerificationResolver } from '../verification.js';

const { fetchOtterVerifyBuildParamsMock } = vi.hoisted(() => ({
    fetchOtterVerifyBuildParamsMock: vi.fn(),
}));

vi.mock('../otter-verify.js', () => ({
    fetchOtterVerifyBuildParams: fetchOtterVerifyBuildParamsMock,
}));

const CLUSTER: SupportedCluster = 'mainnet-beta';
const PROGRAM_ADDRESS = gen.tokenProgram;
const AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
const PROGRAM_DATA_B64 = Buffer.from('deadbeef', 'hex').toString('base64');
const KNOWN_HASH = hashProgramData(PROGRAM_DATA_B64);
const TRUSTED_SIGNER = '9VWiUUhgNoRwTH5NVehYJEDwcotwYX3VgW4MChiHPAqU';
const FOUNDATION_SIGNER = '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r';
const EXPLORER_SIGNER = 'CyJj5ejJAUveDXnLduJbkvwjxcmWJNqCuB9DR7AExrHn';
const UNTRUSTED_SIGNER = 'randomUntrustedSigner111111111111111111111';

type OsecEntry = {
    commit: string;
    executable_hash: string;
    is_frozen: boolean;
    is_verified: boolean;
    last_verified_at: string;
    on_chain_hash: string;
    repo_url: string;
    signer: string;
};

function makeOsecEntry(overrides: Partial<OsecEntry> = {}): OsecEntry {
    return {
        commit: '',
        executable_hash: 'exec_hash_abc',
        is_frozen: false,
        is_verified: true,
        last_verified_at: '2026-01-15T00:00:00Z',
        on_chain_hash: KNOWN_HASH,
        repo_url: '',
        signer: TRUSTED_SIGNER,
        ...overrides,
    };
}

function makeBuildParams(overrides: Partial<BuildParams> = {}): BuildParams {
    return {
        address: PROGRAM_ADDRESS,
        args: [],
        commit: 'abc123',
        deploySlot: 100,
        gitUrl: 'https://github.com/example/repo',
        signer: TRUSTED_SIGNER,
        version: '1.0.0',
        ...overrides,
    };
}

function stubOsecFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(body),
        ok: status >= 200 && status < 300,
        status,
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createResolver() {
    const dependencies: OtterVerifyDependencies = {
        fetchAccountInfo: vi.fn(),
        logger: createLoggerMock(),
        resolveIdlClient: vi.fn(),
    };
    return { dependencies, resolve: createVerificationResolver(dependencies) };
}

describe('createVerificationResolver', () => {
    beforeEach(() => {
        fetchOtterVerifyBuildParamsMock.mockReset();
        fetchOtterVerifyBuildParamsMock.mockResolvedValue(null);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return verified with evidence for a trusted signer with a matching hash', async () => {
        const fetchMock = stubOsecFetch([makeOsecEntry()]);
        const { dependencies, resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            evidence: {
                executable_hash: 'exec_hash_abc',
                is_frozen: false,
                last_verified_at: '2026-01-15T00:00:00Z',
                message: 'Verification information provided by a trusted signer.',
                on_chain_hash: KNOWN_HASH,
                repo_url: null,
                signer: TRUSTED_SIGNER,
                signer_label: 'OtterSecurity',
            },
            status: 'verified',
        });
        expect(fetchMock).toHaveBeenCalledWith(
            `https://verify.osec.io/status-all/${PROGRAM_ADDRESS}`,
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(fetchOtterVerifyBuildParamsMock).toHaveBeenCalledWith(
            PROGRAM_ADDRESS,
            TRUSTED_SIGNER,
            CLUSTER,
            dependencies,
        );
    });

    it('should return unverified when every entry has is_verified false', async () => {
        stubOsecFetch([makeOsecEntry({ is_verified: false })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            status: 'unverified',
        });
    });

    it('should return unverified when the signer is neither trusted nor the authority', async () => {
        stubOsecFetch([makeOsecEntry({ signer: UNTRUSTED_SIGNER })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            status: 'unverified',
        });
    });

    it('should return verified when the signer is the program authority', async () => {
        stubOsecFetch([makeOsecEntry({ signer: AUTHORITY })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: {
                message: 'Verification information provided by the program authority.',
                signer: AUTHORITY,
                signer_label: null,
            },
            status: 'verified',
        });
    });

    it('should prefer the authority entry over a trusted signer', async () => {
        stubOsecFetch([makeOsecEntry(), makeOsecEntry({ signer: AUTHORITY })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { signer: AUTHORITY },
            status: 'verified',
        });
    });

    it('should preserve the trusted-signer hierarchy order', async () => {
        stubOsecFetch([makeOsecEntry(), makeOsecEntry({ signer: FOUNDATION_SIGNER })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { signer: FOUNDATION_SIGNER, signer_label: 'Foundation' },
            status: 'verified',
        });
    });

    it('should skip hierarchy entries whose hash mismatches', async () => {
        stubOsecFetch([makeOsecEntry({ on_chain_hash: 'stale-hash', signer: AUTHORITY }), makeOsecEntry()]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { signer: TRUSTED_SIGNER },
            status: 'verified',
        });
    });

    it('should return unverified when the trusted signer hash mismatches', async () => {
        stubOsecFetch([makeOsecEntry({ on_chain_hash: 'wrong_hash_that_does_not_match' })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            status: 'unverified',
        });
    });

    it('should trim trailing zero padding when hashing program data', async () => {
        const paddedProgramData = Buffer.from('deadbeef0000', 'hex').toString('base64');
        stubOsecFetch([makeOsecEntry()]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, paddedProgramData, CLUSTER)).resolves.toMatchObject({
            status: 'verified',
        });
    });

    it('should return unknown when program data is null for an authority-held program', async () => {
        stubOsecFetch([makeOsecEntry()]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, null, CLUSTER)).resolves.toEqual({
            reason: 'verification_invalid',
            status: 'unknown',
        });
        expect(fetchOtterVerifyBuildParamsMock).not.toHaveBeenCalled();
    });

    it('should return verified for a frozen program without a hash check', async () => {
        stubOsecFetch([
            makeOsecEntry({ is_frozen: true, on_chain_hash: 'ignored-for-frozen', signer: UNTRUSTED_SIGNER }),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toMatchObject({
            evidence: {
                is_frozen: true,
                message: 'Verification information provided by the program deployer.',
                signer: UNTRUSTED_SIGNER,
                signer_label: null,
            },
            status: 'verified',
        });
    });

    it('should return unverified when no entry is frozen for an authority-less program', async () => {
        stubOsecFetch([makeOsecEntry({ is_frozen: false })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toEqual({ status: 'unverified' });
    });

    it('should ignore frozen entries that are not verified', async () => {
        stubOsecFetch([makeOsecEntry({ is_frozen: true, is_verified: false })]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toEqual({ status: 'unverified' });
    });

    it('should select the earliest frozen entry when multiple exist', async () => {
        stubOsecFetch([
            makeOsecEntry({ is_frozen: true, last_verified_at: '2026-03-01T00:00:00Z' }),
            makeOsecEntry({ is_frozen: true, last_verified_at: '2026-01-01T00:00:00Z', signer: EXPLORER_SIGNER }),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toMatchObject({
            evidence: { last_verified_at: '2026-01-01T00:00:00Z' },
            status: 'verified',
        });
    });

    it('should sort a frozen entry with an unparseable date after a valid one', async () => {
        stubOsecFetch([
            makeOsecEntry({ is_frozen: true, last_verified_at: 'not-a-date', signer: EXPLORER_SIGNER }),
            makeOsecEntry({ is_frozen: true, last_verified_at: '2026-01-01T00:00:00Z' }),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toMatchObject({
            evidence: { last_verified_at: '2026-01-01T00:00:00Z' },
            status: 'verified',
        });
    });

    it('should sort a frozen entry with a valid date before an unparseable one', async () => {
        stubOsecFetch([
            makeOsecEntry({ is_frozen: true, last_verified_at: '2026-01-01T00:00:00Z' }),
            makeOsecEntry({ is_frozen: true, last_verified_at: 'not-a-date', signer: EXPLORER_SIGNER }),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toMatchObject({
            evidence: { last_verified_at: '2026-01-01T00:00:00Z' },
            status: 'verified',
        });
    });

    it('should keep order stable when all frozen dates are unparseable', async () => {
        // lenient V8 Date.parse turns strings like 'invalid-date-1' into real dates — these two stay NaN
        stubOsecFetch([
            makeOsecEntry({ is_frozen: true, last_verified_at: 'not-a-date' }),
            makeOsecEntry({ is_frozen: true, last_verified_at: 'nor-is-this-a-date', signer: EXPLORER_SIGNER }),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, null, null, CLUSTER)).resolves.toMatchObject({
            evidence: { last_verified_at: 'not-a-date', signer: TRUSTED_SIGNER },
            status: 'verified',
        });
    });

    it('should return unknown with source_unavailable when the registry fetch rejects', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
        const { dependencies, resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
        });
        expect(dependencies.logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] verification osec fetch failed',
            expect.objectContaining({ programAddress: PROGRAM_ADDRESS }),
        );
    });

    it('should return unknown with source_unavailable on an HTTP error status', async () => {
        stubOsecFetch(null, 500);
        const { dependencies, resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
        });
        expect(dependencies.logger.warn).toHaveBeenCalledTimes(1);
    });

    it('should return unknown with verification_invalid for a non-array response', async () => {
        stubOsecFetch({ some: 'object' });
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            reason: 'verification_invalid',
            status: 'unknown',
        });
    });

    it('should return unverified for an empty registry response', async () => {
        stubOsecFetch([]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            status: 'unverified',
        });
    });

    it('should filter malformed registry entries by shape', async () => {
        const authorityEntry = makeOsecEntry({ signer: AUTHORITY });
        stubOsecFetch([
            null,
            'not-an-object',
            ['array-entry'],
            { ...authorityEntry, signer: 42 },
            { ...authorityEntry, is_verified: 'yes' },
            { ...authorityEntry, on_chain_hash: 7 },
            { ...authorityEntry, executable_hash: null },
            { ...authorityEntry, repo_url: 3 },
            { ...authorityEntry, commit: false },
            { ...authorityEntry, is_frozen: 'no' },
            { ...authorityEntry, last_verified_at: 9 },
            makeOsecEntry(),
        ]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { signer: TRUSTED_SIGNER },
            status: 'verified',
        });
    });

    it('should return unverified when all entries are malformed', async () => {
        stubOsecFetch([{ is_verified: true }, { signer: 'abc' }, null]);
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toEqual({
            status: 'unverified',
        });
    });

    it('should build repo_url from the build params git url and commit', async () => {
        stubOsecFetch([makeOsecEntry()]);
        fetchOtterVerifyBuildParamsMock.mockResolvedValue(makeBuildParams());
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { repo_url: 'https://github.com/example/repo/tree/abc123' },
            status: 'verified',
        });
    });

    it('should omit the tree segment when build params carry no commit', async () => {
        stubOsecFetch([makeOsecEntry()]);
        fetchOtterVerifyBuildParamsMock.mockResolvedValue(makeBuildParams({ commit: '' }));
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { repo_url: 'https://github.com/example/repo' },
            status: 'verified',
        });
    });

    it('should keep repo_url null when build params carry no git url', async () => {
        stubOsecFetch([makeOsecEntry()]);
        fetchOtterVerifyBuildParamsMock.mockResolvedValue(makeBuildParams({ gitUrl: '' }));
        const { resolve } = createResolver();

        await expect(resolve(PROGRAM_ADDRESS, AUTHORITY, PROGRAM_DATA_B64, CLUSTER)).resolves.toMatchObject({
            evidence: { repo_url: null },
            status: 'verified',
        });
    });
});
