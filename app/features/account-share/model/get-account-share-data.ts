import { truncateAddress } from '@entities/address';
import {
    type Address,
    address as toAddress,
    createSolanaRpc,
    getAddressDecoder,
    type Rpc,
    type SolanaRpcApi,
} from '@solana/kit';
import { Cluster, type ServerCluster, serverClusterUrl } from '@utils/cluster';
import { lamportsToSolString } from '@utils/index';
import { programLabel } from '@utils/tx';

import { Logger } from '@/app/shared/lib/logger';

import { getProgramProvenance } from '../api/get-program-provenance';
import {
    BPF_UPGRADEABLE_LOADER_ADDRESS,
    PROGRAM_DATA_HEADER_SIZE,
    RPC_BUDGET_MS,
    SIGNATURE_LOOKUP_LIMIT,
} from '../lib/constants';
import { formatBytes, formatDateShort } from '../lib/format';
import type {
    AccountCardData,
    AccountShareData,
    NotFoundCardData,
    ProgramCardData,
    UpgradeAuthority,
} from './account-share-data';

type ShareRpc = Rpc<SolanaRpcApi>;

/** The card, or a signal the route turns into a status code. A missing account is a card, not an error. */
export type AccountShareResult = { kind: 'ok'; data: AccountShareData } | { kind: 'error' };

// How the card writes an account key when it is the fallback program name.
const NAME_PAD = 6;

/**
 * The data behind `/og/account/<address>`, read from the cluster the link named or from mainnet by default.
 *
 * Never throws: every failure becomes a result the route turns into a status code, and a missing account
 * renders as a not-found card rather than an error. All RPC work shares one wall-clock budget.
 * @param address - The account address from the route (already validated as a base58 address)
 * @param cluster - The cluster from `?cluster=`, absent when the link carried none (means mainnet)
 */
export async function getAccountShareData(address: string, cluster?: ServerCluster): Promise<AccountShareResult> {
    const resolved = cluster ?? Cluster.MainnetBeta;

    try {
        const abortSignal = AbortSignal.timeout(RPC_BUDGET_MS);
        const rpc = createSolanaRpc(serverClusterUrl(resolved));
        const accountAddress = toAddress(address);

        const { value } = await rpc.getAccountInfo(accountAddress, { encoding: 'jsonParsed' }).send({ abortSignal });

        if (!value) {
            return { data: await buildNotFound(rpc, accountAddress, address, abortSignal), kind: 'ok' };
        }

        const owner = String(value.owner);
        const space = accountSpace(value);

        const data = value.executable
            ? await buildProgram({ abortSignal, address, cluster: resolved, owner, rpc, space, value })
            : await buildAccount({ abortSignal, address, owner, rpc, space, value });

        return { data, kind: 'ok' };
    } catch (error) {
        Logger.error(new Error('[account-share] Failed to get account share data', { cause: error }), { address });
        return { kind: 'error' };
    }
}

type AccountInfoValue = { executable: boolean; lamports: bigint; owner: unknown; space?: bigint; data: unknown };

/** The account's on-chain byte length, from the `space` the RPC reports. */
function accountSpace(value: { space?: bigint }): number {
    return value.space === undefined ? 0 : Number(value.space);
}

async function buildAccount(args: {
    abortSignal: AbortSignal;
    address: string;
    owner: string;
    rpc: ShareRpc;
    space: number;
    value: AccountInfoValue;
}): Promise<AccountCardData> {
    const { abortSignal, address, owner, rpc, space, value } = args;
    const activity = await getActivity(rpc, toAddress(address), abortSignal);

    return {
        address,
        balance: `${lamportsToSolString(value.lamports)} SOL`,
        dataSize: formatBytes(space),
        executable: false,
        kind: 'account',
        lastActivity: activity.lastActivity,
        owner,
        transactionCount: activity.count,
        transactionCountIsCapped: activity.capped,
    };
}

async function buildProgram(args: {
    abortSignal: AbortSignal;
    address: string;
    cluster: ServerCluster;
    owner: string;
    rpc: ShareRpc;
    space: number;
    value: AccountInfoValue;
}): Promise<ProgramCardData> {
    const { abortSignal, address, cluster, owner, rpc, space, value } = args;
    const programId = toAddress(address);

    // The program bytes live in a separate data account under the upgradeable loader; a program under any
    // other loader is immutable and carries its bytes (and thus its size) in the account we already have.
    const isUpgradeable = owner === BPF_UPGRADEABLE_LOADER_ADDRESS;
    const [programData, provenance] = await Promise.all([
        isUpgradeable ? getProgramData(rpc, value, abortSignal) : Promise.resolve(undefined),
        getProgramProvenance(rpc, programId, cluster, abortSignal),
    ]);

    // The static registry names the best-known programs; an on-chain IDL names the rest; the address is last.
    const name = programLabel(address, cluster) ?? provenance.name ?? truncateAddress(address, NAME_PAD);

    // A program under a non-upgradeable loader is genuinely immutable; an upgradeable one's authority (and
    // size) is unknown until its data account resolves below, so neither is asserted here.
    let upgradeAuthority: UpgradeAuthority | undefined = isUpgradeable ? undefined : { note: 'Immutable' };
    let lastDeployedSlot: number | undefined;
    let programSize = isUpgradeable ? undefined : formatBytes(space);

    if (programData) {
        lastDeployedSlot = programData.slot;
        programSize = formatBytes(Math.max(0, programData.space - PROGRAM_DATA_HEADER_SIZE));
        // The authority key prints on its own; its structure (single key vs multisig) is not derived here,
        // so no note is invented beyond the immutable case.
        upgradeAuthority = programData.authority ? { address: programData.authority } : { note: 'Immutable' };
    }

    return {
        address,
        kind: 'program',
        lastDeployedSlot,
        markers: provenance.markers,
        name,
        programSize,
        upgradeAuthority,
    };
}

async function buildNotFound(
    rpc: ShareRpc,
    accountAddress: Address,
    address: string,
    abortSignal: AbortSignal,
): Promise<NotFoundCardData> {
    // A closed account keeps its history; an address that never held one has none. That is the only signal
    // that separates the two on the cluster we are reading, so the "other cluster" copy is not inferred here.
    const reason = (await hasHistory(rpc, accountAddress, abortSignal)) ? 'closed' : 'never-used';
    return { address, kind: 'not-found', reason };
}

type Activity = { capped?: boolean; count?: string; lastActivity?: string };

/**
 * The signature count (capped at one page) and the most recent activity date.
 * One RPC call; failures leave both fields absent, so the activity line simply does not render.
 */
async function getActivity(rpc: ShareRpc, accountAddress: Address, abortSignal: AbortSignal): Promise<Activity> {
    try {
        const signatures = await rpc
            .getSignaturesForAddress(accountAddress, { limit: SIGNATURE_LOOKUP_LIMIT })
            .send({ abortSignal });
        if (signatures.length === 0) return {};

        // The RPC returns newest first, so the first entry carries the last activity.
        const blockTime = signatures[0]?.blockTime;
        return {
            capped: signatures.length >= SIGNATURE_LOOKUP_LIMIT,
            count: signatures.length.toLocaleString('en-US'),
            lastActivity: blockTime ? formatDateShort(Number(blockTime)) : undefined,
        };
    } catch (error) {
        Logger.warn('[account-share] Activity lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return {};
    }
}

async function hasHistory(rpc: ShareRpc, accountAddress: Address, abortSignal: AbortSignal): Promise<boolean> {
    try {
        const signatures = await rpc.getSignaturesForAddress(accountAddress, { limit: 1 }).send({ abortSignal });
        return signatures.length > 0;
    } catch {
        return false;
    }
}

type ProgramData = { authority: string | undefined; slot: number; space: number };

// The upgradeable program-data account opens with a 4-byte enum tag, then the deploy slot (u64), then an
// optional 32-byte upgrade authority. The whole account past this is the program binary - megabytes we
// never download: `dataSlice` fetches only the header while `space` still reports the full byte length.
const PROGRAM_DATA_SLOT_OFFSET = 4;
const PROGRAM_DATA_AUTHORITY_FLAG_OFFSET = 12;
const PROGRAM_DATA_AUTHORITY_OFFSET = 13;
const PUBKEY_LENGTH = 32;

/** The upgrade authority, deploy slot, and byte length from a program's data account. */
async function getProgramData(
    rpc: ShareRpc,
    programValue: AccountInfoValue,
    abortSignal: AbortSignal,
): Promise<ProgramData | undefined> {
    try {
        const programDataAddress = parsedInfo(programValue.data)?.programData;
        if (typeof programDataAddress !== 'string') return undefined;

        const { value } = await rpc
            .getAccountInfo(toAddress(programDataAddress), {
                dataSlice: { length: PROGRAM_DATA_HEADER_SIZE, offset: 0 },
                encoding: 'base64',
            })
            .send({ abortSignal });
        if (!value) return undefined;

        const header = base64Data(value.data);
        if (!header) return undefined;

        return { ...parseProgramDataHeader(header), space: accountSpace(value) };
    } catch (error) {
        Logger.warn('[account-share] Program-data lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return undefined;
    }
}

/** The `[data, 'base64']` tuple of a base64-encoded account, or undefined when the account did not encode so. */
function base64Data(data: unknown): string | undefined {
    return Array.isArray(data) && typeof data[0] === 'string' ? data[0] : undefined;
}

/** The deploy slot and optional upgrade authority from the program-data account's fixed-layout header. */
function parseProgramDataHeader(base64: string): { authority: string | undefined; slot: number } {
    const bytes = Buffer.from(base64, 'base64');
    const slot = Number(bytes.readBigUInt64LE(PROGRAM_DATA_SLOT_OFFSET));
    const hasAuthority = bytes[PROGRAM_DATA_AUTHORITY_FLAG_OFFSET] === 1;
    const authority =
        hasAuthority && bytes.length >= PROGRAM_DATA_AUTHORITY_OFFSET + PUBKEY_LENGTH
            ? getAddressDecoder().decode(
                  bytes.subarray(PROGRAM_DATA_AUTHORITY_OFFSET, PROGRAM_DATA_AUTHORITY_OFFSET + PUBKEY_LENGTH),
              )
            : undefined;
    return { authority, slot };
}

/** The `info` object of an RPC `jsonParsed` account, or undefined when the account did not parse. */
function parsedInfo(data: unknown): Record<string, unknown> | undefined {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !('parsed' in data)) return undefined;
    const parsed = (data as { parsed?: unknown }).parsed;
    if (!parsed || typeof parsed !== 'object' || !('info' in parsed)) return undefined;
    const info = (parsed as { info?: unknown }).info;
    return info && typeof info === 'object' ? (info as Record<string, unknown>) : undefined;
}
