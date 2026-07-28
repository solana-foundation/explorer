// Ported from explorer-mcp's squads resolver — Squads Lambda lookup (mainnet only), then the
// multisig account decoded with idl-decode over the bundled v3/v4 IDL stubs (no anchor).
import { type IdlClient, tryCreateIdlClient } from '@explorer/idl-decode';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { normalizeAccountProbe } from '../accounts/account-normalizer.js';
import { SQUADS_LAMBDA_URL } from '../shared/constants.js';
import { squadsV3Idl } from './idls/squads-v3.js';
import { squadsV4Idl } from './idls/squads-v4.js';
import { asRecord, asSafeNumeric, asString } from '../shared/parse-helpers.js';
import { err, ok, type Result, toError } from '../shared/result.js';
import type { RpcClient } from '../rpc/rpc.js';
import type { MultisigReferenceResult } from './types.js';

const LAMBDA_FETCH_TIMEOUT_MS = 5000;

export type SquadsMultisigDependencies = {
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    logger: InspectorLogger;
};

type SquadsVersion = 'v3' | 'v4';

type LambdaResult = {
    isSquad: boolean;
    version: SquadsVersion;
    multisig: string;
};

type MultisigDetails = { threshold: number; members: string[] };

async function fetchSquadsLambdaInfo(authority: string): Promise<Result<LambdaResult | null>> {
    let response: Response;
    try {
        response = await fetch(`${SQUADS_LAMBDA_URL}/${encodeURIComponent(authority)}`, {
            signal: AbortSignal.timeout(LAMBDA_FETCH_TIMEOUT_MS),
        });
    } catch (error) {
        return err(toError(error));
    }

    if (!response.ok) {
        return err(new Error(`Lambda responded with HTTP ${response.status}`));
    }

    let data: Record<string, unknown> | null;
    try {
        data = asRecord(await response.json());
    } catch (error) {
        return err(toError(error));
    }
    if (!data || 'error' in data || !data.isSquad) return ok(null);
    const version = data.version;
    if (version !== 'v3' && version !== 'v4') return ok(null);
    const multisig = asString(data.multisig);
    if (!multisig) return ok(null);
    return ok({ isSquad: true, multisig, version });
}

function createSquadsClient(version: SquadsVersion): IdlClient {
    const [error, client] = tryCreateIdlClient(version === 'v3' ? squadsV3Idl : squadsV4Idl);
    if (error) throw new Error(`squads ${version} idl rejected (code ${error.code})`);
    return client;
}

async function fetchDecodedMultisigAccount(
    version: SquadsVersion,
    multisigAddress: string,
    cluster: SupportedCluster,
    fetchAccountInfo: RpcClient['fetchAccountInfo'],
): Promise<Record<string, unknown>> {
    const probe = await fetchAccountInfo(multisigAddress, cluster, { encoding: 'base64' });
    const bytes = normalizeAccountProbe(multisigAddress, probe)?.rawDataBytes;
    if (!bytes) throw new Error('squads multisig account not found');

    const client = createSquadsClient(version);
    const [error, decoded] = client.decodeAccountData<Record<string, unknown>>(bytes);
    if (error) throw new Error(`squads ${version} multisig decode failed (code ${error.code})`);
    return decoded;
}

// V3 `Ms.keys` is pubkey[]; V4 `Multisig.members` is { key, permissions }[] — both land as base58 strings.
function extractMembers(version: SquadsVersion, account: Record<string, unknown>): string[] {
    const raw = version === 'v3' ? account.keys : account.members;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap(entry => {
        const key = version === 'v3' ? asString(entry) : asString(asRecord(entry)?.key);
        return key ? [key] : [];
    });
}

function toMultisigDetails(version: SquadsVersion, account: Record<string, unknown>): MultisigDetails | null {
    const threshold = asSafeNumeric(account.threshold);
    if (typeof threshold !== 'number' || threshold <= 0) return null;

    const members = extractMembers(version, account);
    if (members.length === 0) return null;

    return { members, threshold };
}

export async function resolveSquadsMultisigReference(
    upgradeAuthority: string | null,
    cluster: SupportedCluster,
    dependencies: SquadsMultisigDependencies,
): Promise<MultisigReferenceResult> {
    const { fetchAccountInfo, logger } = dependencies;
    if (!upgradeAuthority) {
        return { status: 'not_multisig' };
    }

    // The Squads Lambda only indexes mainnet.
    if (cluster !== 'mainnet-beta') {
        return { reason: 'source_unavailable', status: 'unknown' };
    }

    const [lambdaError, lambdaInfo] = await fetchSquadsLambdaInfo(upgradeAuthority);
    if (lambdaError) {
        logger.warn(ns('squads lambda lookup failed'), { error: lambdaError, upgradeAuthority });
        return { reason: 'source_unavailable', status: 'unknown' };
    }
    if (!lambdaInfo) {
        return { status: 'not_multisig' };
    }

    try {
        const account = await fetchDecodedMultisigAccount(
            lambdaInfo.version,
            lambdaInfo.multisig,
            cluster,
            fetchAccountInfo,
        );
        const details = toMultisigDetails(lambdaInfo.version, account);

        return {
            members: details?.members ?? null,
            multisig_address: lambdaInfo.multisig,
            status: 'is_multisig',
            threshold: details?.threshold ?? null,
            version: lambdaInfo.version,
        };
    } catch (error) {
        logger.warn(ns('squads multisig resolve failed'), { error, upgradeAuthority });
        return { reason: 'source_unavailable', status: 'unknown' };
    }
}
