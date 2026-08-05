// Ported from explorer-mcp's otter-verify-pda; anchor account.fetch replaced by the IDL-client
// seam (the verify program's on-chain IDL) + a base64 account probe decoded with idl-decode.
import { address, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { normalizeAccountProbe } from '../accounts/account-normalizer.js';
import type { ResolveIdlClient } from './idl-clients.js';
import { asSafeNumeric, asString } from '../shared/parse-helpers.js';
import type { RpcClient } from '../rpc/rpc.js';

export const VERIFY_PROGRAM_ID = 'verifycLy8mB96wd9wqq3WDXQwM4oU6r42Th37Db9fC';

const PDA_SEED = 'otter_verify';

export type BuildParams = {
    address: string;
    signer: string;
    version: string;
    gitUrl: string;
    commit: string;
    args: string[];
    deploySlot: number;
};

export type OtterVerifyDependencies = {
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    resolveIdlClient: ResolveIdlClient;
    logger: InspectorLogger;
};

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap(entry => {
        const item = asString(entry);
        return item !== null ? [item] : [];
    });
}

function toBuildParams(account: Record<string, unknown>): BuildParams {
    const deploySlot = asSafeNumeric(account.deploySlot);
    return {
        address: asString(account.address) ?? '',
        args: toStringArray(account.args),
        commit: asString(account.commit) ?? '',
        deploySlot: typeof deploySlot === 'number' ? deploySlot : Number(deploySlot ?? 0),
        gitUrl: asString(account.gitUrl) ?? '',
        signer: asString(account.signer) ?? '',
        version: asString(account.version) ?? '',
    };
}

/** Build params recorded by the winner's otter-verify PDA; null when unavailable — never rejects. */
export async function fetchOtterVerifyBuildParams(
    programAddress: string,
    signer: string,
    cluster: SupportedCluster,
    dependencies: OtterVerifyDependencies,
): Promise<BuildParams | null> {
    const { fetchAccountInfo, resolveIdlClient, logger } = dependencies;
    try {
        const client = await resolveIdlClient(VERIFY_PROGRAM_ID, cluster);
        if (!client) return null;

        const addressEncoder = getAddressEncoder();
        const [pda] = await getProgramDerivedAddress({
            programAddress: address(VERIFY_PROGRAM_ID),
            seeds: [PDA_SEED, addressEncoder.encode(address(signer)), addressEncoder.encode(address(programAddress))],
        });

        const probe = await fetchAccountInfo(pda, cluster, { encoding: 'base64' });
        const bytes = normalizeAccountProbe(pda, probe)?.rawDataBytes;
        if (!bytes) return null;

        const [error, decoded] = client.decodeAccountData<Record<string, unknown>>(bytes);
        if (error) return null;

        return toBuildParams(decoded);
    } catch (error) {
        logger.warn(ns('otter verify fetch failed'), { error, programAddress });
        return null;
    }
}
