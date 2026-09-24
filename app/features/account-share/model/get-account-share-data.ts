import { truncateAddress } from '@entities/address';
import { getRpc, type SolanaRpc } from '@entities/cluster/server';
import { hashProgramBytes } from '@explorer/entity-inspector/verification';
import { formatBytes } from '@shared/lib/format-bytes';
import { type Address, address as toAddress, getAddressDecoder } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { Cluster, type ServerCluster, serverClusterUrl } from '@utils/cluster';
import { lamportsToSolString } from '@utils/index';
import { programLabel } from '@utils/tx';

import { Logger } from '@/app/shared/lib/logger';

import { getProgramProvenance, isVerifiedBuild } from '../api/get-program-provenance';
import {
    BPF_LOADER_2_ADDRESS,
    BPF_LOADER_ADDRESS,
    BPF_UPGRADEABLE_LOADER_ADDRESS,
    LOADER_V4_ADDRESS,
    LOADER_V4_HEADER_SIZE,
    NATIVE_LOADER_ADDRESS,
    PROGRAM_DATA_HEADER_SIZE,
    RPC_BUDGET_MS,
    SIGNATURE_LOOKUP_LIMIT,
} from '../lib/constants';
import { formatDateShort } from '../lib/format';
import type {
    AccountCardData,
    AccountShareData,
    NotFoundCardData,
    NotFoundReason,
    ProgramCardData,
    ProgramLoader,
    ProgramMarkers,
    UpgradeAuthority,
} from './account-share-data';

/** The card, or a signal the route turns into a status code. A missing account is a card, not an error. */
export type AccountShareResult = { kind: 'ok'; data: AccountShareData } | { kind: 'error' };

const NAME_PAD = 6;

/**
 * The data behind `/og/account/<address>`, read from the named cluster or mainnet by default. Never throws:
 * every failure becomes a result, a missing account renders as a not-found card, and all RPC work shares one
 * wall-clock budget.
 */
export async function getAccountShareData(address: string, cluster?: ServerCluster): Promise<AccountShareResult> {
    const resolved = cluster ?? Cluster.MainnetBeta;

    try {
        const abortSignal = AbortSignal.timeout(RPC_BUDGET_MS);
        const rpc = getRpc(serverClusterUrl(resolved));
        const accountAddress = toAddress(address);

        // 36 bytes is all any card reads from the account: balance/owner/executable/size come from the meta,
        // and a program's only on-account payload we need is the 32-byte program-data pointer past the tag.
        const { value } = await rpc
            .getAccountInfo(accountAddress, { dataSlice: { length: 36, offset: 0 }, encoding: 'base64' })
            .send({ abortSignal });

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

type AccountInfoValue = { data: unknown; executable: boolean; lamports: bigint; owner: Address; space?: bigint };

function accountSpace(value: { space?: bigint }): number {
    return value.space === undefined ? 0 : Number(value.space);
}

async function buildAccount(args: {
    abortSignal: AbortSignal;
    address: string;
    owner: string;
    rpc: SolanaRpc;
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
        lastActivity:
            activity.kind === 'some' && activity.lastActivity ? formatDateShort(activity.lastActivity) : undefined,
        // A system-owned account is an ordinary wallet; omit the misleading "Owned by 1111…".
        owner: owner === SYSTEM_PROGRAM_ADDRESS ? undefined : owner,
        transactionCount: activity.kind === 'some' ? activity.count.toLocaleString('en-US') : undefined,
        transactionCountIsCapped: activity.kind === 'some' ? activity.capped : undefined,
    };
}

async function buildProgram(args: {
    abortSignal: AbortSignal;
    address: string;
    cluster: ServerCluster;
    owner: string;
    rpc: SolanaRpc;
    space: number;
    value: AccountInfoValue;
}): Promise<ProgramCardData> {
    const { abortSignal, address, cluster, owner, rpc, space, value } = args;
    const programId = toAddress(address);
    const loader = programLoader(owner);

    // Only the upgradeable loader keeps bytes/authority/slot in a separate data account.
    const [programData, provenance] = await Promise.all([
        loader === 'upgradeable' ? getProgramData(rpc, value, abortSignal) : Promise.resolve(undefined),
        getProgramProvenance(rpc, programId, cluster, abortSignal),
    ]);

    // Static registry first, then the on-chain IDL name, then the truncated address.
    const name = programLabel(address, cluster) ?? provenance.name ?? truncateAddress(address, NAME_PAD);

    const markers: ProgramMarkers = {
        idlUploaded: provenance.idlUploaded,
        securityTxt: provenance.securityTxt,
        verifiedBuild: isVerifiedBuild(provenance.verifiedEntries, programData?.authority, programData?.localHash),
    };

    return { address, kind: 'program', markers, name, ...describeProgram(loader, space, programData) };
}

/** The loader that owns an executable account - where its bytes live and whether it can be upgraded. */
function programLoader(owner: string): ProgramLoader {
    switch (owner) {
        case BPF_UPGRADEABLE_LOADER_ADDRESS:
            return 'upgradeable';
        case LOADER_V4_ADDRESS:
            return 'v4';
        case BPF_LOADER_ADDRESS:
        case BPF_LOADER_2_ADDRESS:
            return 'immutable-elf';
        case NATIVE_LOADER_ADDRESS:
            return 'native';
        default:
            return 'unknown';
    }
}

type ProgramFacts = { lastDeployedSlot?: number; programSize?: string; upgradeAuthority?: UpgradeAuthority };

/** The size, authority, and deploy slot a program card shows, each derived from its loader's layout. */
function describeProgram(loader: ProgramLoader, space: number, programData: ProgramData | undefined): ProgramFacts {
    switch (loader) {
        case 'upgradeable':
            // Authority (and size) live in the data account; until it resolves neither can be asserted.
            if (!programData) return {};
            return {
                lastDeployedSlot: programData.slot,
                programSize: formatBytes(Math.max(0, programData.space - PROGRAM_DATA_HEADER_SIZE)),
                upgradeAuthority: programData.authority ? { address: programData.authority } : { note: 'Immutable' },
            };
        case 'immutable-elf':
            // A legacy loader keeps the ELF in the program account itself and can never be upgraded.
            return { programSize: formatBytes(space), upgradeAuthority: { note: 'Immutable' } };
        case 'v4':
            // LoaderV4 keeps a mutable ELF behind a fixed header; its authority lives in that header, which
            // the 36-byte slice does not include, so it is left undetermined rather than wrongly immutable.
            return { programSize: formatBytes(Math.max(0, space - LOADER_V4_HEADER_SIZE)) };
        case 'native':
            // A builtin's account holds its name, not its bytes, so there is no byte size worth showing.
            return { upgradeAuthority: { note: 'Immutable' } };
        default:
            return { programSize: formatBytes(space) };
    }
}

async function buildNotFound(
    rpc: SolanaRpc,
    accountAddress: Address,
    address: string,
    abortSignal: AbortSignal,
): Promise<NotFoundCardData> {
    // History is the only signal that separates a closed account from one that never existed. When the
    // lookup itself fails we know neither, so the card says so rather than guessing "never used".
    const history = await hasHistory(rpc, accountAddress, abortSignal);
    const reason: NotFoundReason = history === undefined ? 'unknown' : history ? 'closed' : 'never-used';
    return { address, kind: 'not-found', reason };
}

/**
 * The program's on-chain activity, kept as a typed union so a failed lookup ("unknown") is never confused
 * with a genuinely empty history ("none"); `lastActivity` is unix seconds.
 */
type Activity =
    { kind: 'unknown' } | { kind: 'none' } | { capped: boolean; count: number; kind: 'some'; lastActivity?: number };

/**
 * The signature count (capped at one page) and the most recent activity time.
 * One RPC call; a failure resolves to `unknown` and an empty history to `none`, so neither renders a count.
 */
async function getActivity(rpc: SolanaRpc, accountAddress: Address, abortSignal: AbortSignal): Promise<Activity> {
    try {
        const signatures = await rpc
            .getSignaturesForAddress(accountAddress, { limit: SIGNATURE_LOOKUP_LIMIT })
            .send({ abortSignal });
        if (signatures.length === 0) return { kind: 'none' };

        // The RPC returns newest first, so the first entry carries the last activity.
        const blockTime = signatures[0]?.blockTime;
        return {
            capped: signatures.length >= SIGNATURE_LOOKUP_LIMIT,
            count: signatures.length,
            kind: 'some',
            lastActivity: blockTime === null || blockTime === undefined ? undefined : Number(blockTime),
        };
    } catch (error) {
        Logger.warn('[account-share] Activity lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return { kind: 'unknown' };
    }
}

/** Whether the address has any on-chain signature history, or `undefined` when the lookup failed. */
async function hasHistory(
    rpc: SolanaRpc,
    accountAddress: Address,
    abortSignal: AbortSignal,
): Promise<boolean | undefined> {
    try {
        const signatures = await rpc.getSignaturesForAddress(accountAddress, { limit: 1 }).send({ abortSignal });
        return signatures.length > 0;
    } catch {
        return undefined;
    }
}

type ProgramData = { authority: string | undefined; localHash: string; slot: number; space: number };

// The upgradeable program-data account opens with a 4-byte enum tag, then the deploy slot (u64), then an
// optional 32-byte upgrade authority (1-byte flag + key). The whole account past this 45-byte header is
// the program ELF, hashed here to re-check the registry's verified claim against the current bytes.
const PROGRAM_DATA_SLOT_OFFSET = 4;
const PROGRAM_DATA_AUTHORITY_FLAG_OFFSET = 12;
const PROGRAM_DATA_AUTHORITY_OFFSET = 13;
const PUBKEY_LENGTH = 32;
// A program account's layout under the upgradeable loader: a 4-byte enum tag, then the program-data address.
const PROGRAM_DATA_POINTER_OFFSET = 4;

/** The upgrade authority, deploy slot, byte length, and on-chain hash from a program's data account. */
async function getProgramData(
    rpc: SolanaRpc,
    programValue: AccountInfoValue,
    abortSignal: AbortSignal,
): Promise<ProgramData | undefined> {
    try {
        const programDataAddress = upgradeableProgramDataAddress(programValue.data);
        if (!programDataAddress) return undefined;

        // Full account this time (no dataSlice): the ELF past the header is what the verified-build hash is
        // computed over, matching what OSEC and the program page hash. Bounded by the shared abort budget.
        const { value } = await rpc
            .getAccountInfo(toAddress(programDataAddress), { encoding: 'base64' })
            .send({ abortSignal });
        if (!value) return undefined;

        const base64 = base64Data(value.data);
        if (!base64) return undefined;

        const bytes = Buffer.from(base64, 'base64');
        return {
            ...parseProgramDataHeader(bytes),
            localHash: hashProgramBytes(bytes.subarray(PROGRAM_DATA_HEADER_SIZE)),
            space: accountSpace(value),
        };
    } catch (error) {
        Logger.warn('[account-share] Program-data lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return undefined;
    }
}

/** The program-data account address a program account points to, read from its 4+32-byte header. */
function upgradeableProgramDataAddress(data: unknown): string | undefined {
    const base64 = base64Data(data);
    if (!base64) return undefined;

    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length < PROGRAM_DATA_POINTER_OFFSET + PUBKEY_LENGTH) return undefined;
    return getAddressDecoder().decode(
        bytes.subarray(PROGRAM_DATA_POINTER_OFFSET, PROGRAM_DATA_POINTER_OFFSET + PUBKEY_LENGTH),
    );
}

/** The `[data, 'base64']` tuple of a base64-encoded account, or undefined when the account did not encode so. */
function base64Data(data: unknown): string | undefined {
    return Array.isArray(data) && typeof data[0] === 'string' ? data[0] : undefined;
}

/** The deploy slot and optional upgrade authority from the program-data account's fixed-layout header. */
function parseProgramDataHeader(bytes: Buffer): { authority: string | undefined; slot: number } {
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
