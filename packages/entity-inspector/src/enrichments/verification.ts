// Ported from explorer-mcp's verification resolver — osec registry (verify.osec.io) with the
// authority-path local re-hash and the frozen-path fallback preserved verbatim.
import type { SupportedCluster } from '../config.js';
import { ns } from '../logger.js';
import { asRecord } from '../shared/parse-helpers.js';
import type { VerificationResult } from './types.js';
import { hashProgramData } from './hash-program-data.js';
import { type BuildParams, fetchOtterVerifyBuildParams, type OtterVerifyDependencies } from './otter-verify.js';
import { TRUSTED_SIGNERS } from './config.js';
import { orderVerifiedEntries } from './verification-core.js';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const VERIFICATION_FETCH_TIMEOUT_MS = 5000;

export type ResolveProgramVerification = (
    programAddress: string,
    programAuthority: string | null,
    programDataBase64: string | null,
    cluster: SupportedCluster,
) => Promise<VerificationResult>;

type OsecInfo = {
    signer: string;
    is_verified: boolean;
    on_chain_hash: string;
    executable_hash: string;
    repo_url: string;
    commit: string;
    last_verified_at: string;
    is_frozen: boolean;
};

function toOsecEntry(value: unknown): OsecInfo | null {
    const entry = asRecord(value);
    if (
        entry &&
        typeof entry.signer === 'string' &&
        typeof entry.is_verified === 'boolean' &&
        typeof entry.on_chain_hash === 'string' &&
        typeof entry.executable_hash === 'string' &&
        typeof entry.repo_url === 'string' &&
        typeof entry.commit === 'string' &&
        typeof entry.is_frozen === 'boolean' &&
        typeof entry.last_verified_at === 'string'
    ) {
        return {
            commit: entry.commit,
            executable_hash: entry.executable_hash,
            is_frozen: entry.is_frozen,
            is_verified: entry.is_verified,
            last_verified_at: entry.last_verified_at,
            on_chain_hash: entry.on_chain_hash,
            repo_url: entry.repo_url,
            signer: entry.signer,
        };
    }
    return null;
}

async function fetchOsecStatusAll(programAddress: string): Promise<unknown> {
    const response = await fetch(`${OSEC_REGISTRY_URL}/status-all/${encodeURIComponent(programAddress)}`, {
        signal: AbortSignal.timeout(VERIFICATION_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// The registry entry is only trusted after re-hashing the live program data against its claim.
function pickAuthorityWinner(entries: OsecInfo[], programAuthority: string, localHash: string): OsecInfo | null {
    return orderVerifiedEntries(entries, programAuthority, localHash).find(e => e.is_verified) ?? null;
}

// NaN dates lose to parsable ones; ties keep the earlier registry entry (matches the source's stable sort).
function isEarlier(candidate: OsecInfo, current: OsecInfo): boolean {
    const candidateAt = Date.parse(candidate.last_verified_at);
    const currentAt = Date.parse(current.last_verified_at);
    if (Number.isNaN(candidateAt)) return false;
    if (Number.isNaN(currentAt)) return true;
    return candidateAt < currentAt;
}

// Authority-less (frozen) programs: earliest still-verified frozen attestation wins.
function pickFrozenWinner(entries: OsecInfo[]): OsecInfo | null {
    let winner: OsecInfo | null = null;
    for (const entry of entries) {
        if (!entry.is_verified || !entry.is_frozen) continue;
        if (winner === null || isEarlier(entry, winner)) {
            winner = entry;
        }
    }
    return winner;
}

function toVerifiedResult(winner: OsecInfo, buildParams: BuildParams | null): VerificationResult {
    const repoUrl = buildParams?.gitUrl
        ? buildParams.gitUrl + (buildParams.commit ? '/tree/' + buildParams.commit : '')
        : null;

    const message = TRUSTED_SIGNERS[winner.signer]
        ? 'Verification information provided by a trusted signer.'
        : winner.is_frozen
          ? 'Verification information provided by the program deployer.'
          : 'Verification information provided by the program authority.';

    return {
        evidence: {
            executable_hash: winner.executable_hash,
            is_frozen: winner.is_frozen,
            last_verified_at: winner.last_verified_at,
            message,
            on_chain_hash: winner.on_chain_hash,
            repo_url: repoUrl,
            signer: winner.signer,
            signer_label: TRUSTED_SIGNERS[winner.signer] ?? null,
        },
        status: 'verified',
    };
}

export function createVerificationResolver(dependencies: OtterVerifyDependencies): ResolveProgramVerification {
    const { logger } = dependencies;
    return async (programAddress, programAuthority, programDataBase64, cluster) => {
        let raw: unknown;
        try {
            raw = await fetchOsecStatusAll(programAddress);
        } catch (error) {
            logger.warn(ns('verification osec fetch failed'), { error, programAddress });
            return { reason: 'source_unavailable', status: 'unknown' };
        }

        if (!Array.isArray(raw)) {
            return { reason: 'verification_invalid', status: 'unknown' };
        }

        const entries = raw.flatMap(value => {
            const entry = toOsecEntry(value);
            return entry ? [entry] : [];
        });

        let winner: OsecInfo | null = null;
        if (programAuthority !== null) {
            if (programDataBase64 === null) {
                return { reason: 'verification_invalid', status: 'unknown' };
            }
            winner = pickAuthorityWinner(entries, programAuthority, hashProgramData(programDataBase64));
        } else {
            winner = pickFrozenWinner(entries);
        }

        if (winner === null) {
            return { status: 'unverified' };
        }

        const buildParams = await fetchOtterVerifyBuildParams(programAddress, winner.signer, cluster, dependencies);
        return toVerifiedResult(winner, buildParams);
    };
}
