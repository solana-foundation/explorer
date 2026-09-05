import type { SolanaRpc } from '@entities/cluster';
import type { Address, Base64EncodedWireTransaction } from '@solana/kit';
import type {
    AccountInfo,
    ParsedAccountData,
    SimulatedTransactionAccountInfo,
    TransactionError,
    VersionedMessage,
} from '@solana/web3.js';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import type { Cluster } from '@utils/cluster';
import { type InstructionLogs, parseProgramLogs } from '@utils/program-logs';

import { withNumbersInsteadOfBigInts } from '@/app/shared/lib/bigint-to-number';
import { toBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { UnsignedV1WireTransaction, V1MessageView } from '@/app/shared/lib/v1-message-bridge';
import { toKitAddress, toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { buildTokenBalances, type TokenBalanceData } from './build-token-balances';
import { computeSolBalanceChanges } from './compute-sol-balance-changes';
import { getMintDecimals } from './get-mint-decimals';
import { resolveAddressLookupTables } from './resolve-address-lookup-tables';
import { ENABLE_TX_V1_FEATURE, isTxV1Active } from './tx-v1-feature';
import type { SolBalanceChange } from './types';

export type SimulationResult = {
    // Every account key the message references, lookup tables resolved, in the order
    // `compiledInstructions` indexes into. Callers that need an instruction's program id must read it
    // from here: `message.staticAccountKeys` is missing any key sourced from a lookup table.
    accountKeys: readonly PublicKey[];
    epoch: bigint;
    logs: InstructionLogs[] | undefined;
    error: string | undefined;
    solBalanceChanges: SolBalanceChange[] | undefined;
    tokenBalanceData: TokenBalanceData | undefined;
    unitsConsumed: number | undefined;
};

type SimulateOptions = {
    rpc: SolanaRpc;
    message: VersionedMessage;
    cluster: Cluster;
    accountBalances?: { preBalances: number[]; postBalances: number[] };
};

/**
 * Run a transaction simulation against the given RPC and return
 * parsed results (logs, SOL changes, token balance rows, etc.).
 */
export async function simulateTransaction({
    rpc,
    message,
    cluster,
    accountBalances,
}: SimulateOptions): Promise<SimulationResult> {
    let raw;
    try {
        raw = await runSimulation(rpc, message);
    } catch (cause) {
        throw (await inactiveV1GateError(rpc, message, cause)) ?? cause;
    }

    const result = interpretSimulation(raw, cluster, accountBalances);

    // Match the error the RPC returned rather than the interpreted one, which reports any failure
    // carrying logs as a bare `TransactionError`.
    if (raw.simResult.err === UNSUPPORTED_VERSION) {
        const gate = await inactiveV1GateError(rpc, message);
        if (gate) {
            return { ...result, error: gate.message };
        }
    }

    if (raw.simResult.err === MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED && message instanceof V1MessageView) {
        const explained = await explainLoadedAccountsDataSize(rpc, message, raw.accountKeys, raw.parsedAccountsPre);
        return explained ? { ...result, error: explained } : result;
    }

    return result;
}

const UNSUPPORTED_VERSION = 'UnsupportedVersion';

/**
 * The error to report in place of a failed v1 simulation when the cluster has no v1 support, or
 * `undefined` when the cluster is not the reason the simulation failed.
 *
 * A node whose runtime predates the v1 feature gate rejects the transaction during sanitization and
 * answers with a bare `UnsupportedVersion`, which reads as a failure of the transaction rather than
 * of the cluster. Which side of the RPC boundary that answer arrives on depends on the node: some
 * reject the request outright, others return it as a simulation error, so both paths land here.
 *
 * The gate is read only once a v1 simulation has already failed, so a cluster that supports v1
 * costs no extra RPC call, and a cluster whose gate cannot be read reports its original failure.
 * The failure that prompted the read is carried along as the cause, since a v1 simulation can fail
 * for reasons of its own on a cluster that happens to lack the gate as well.
 */
async function inactiveV1GateError(
    rpc: SolanaRpc,
    message: VersionedMessage,
    cause?: unknown,
): Promise<Error | undefined> {
    if (!(message instanceof V1MessageView)) {
        return undefined;
    }

    try {
        if (await isTxV1Active(rpc)) {
            return undefined;
        }
    } catch (cause) {
        Logger.error(new Error('Failed to read the transaction v1 feature gate', { cause }));
        return undefined;
    }

    return new Error(
        `this cluster does not support v1 transactions yet — feature gate ${ENABLE_TX_V1_FEATURE} is not active`,
        { cause },
    );
}

type RawSimulation = {
    accountKeys: PublicKey[];
    epoch: bigint;
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[];
    simResult: {
        accounts: (SimulatedTransactionAccountInfo | undefined)[];
        err: TransactionError | null;
        logs: string[];
        unitsConsumed: number | undefined;
    };
};

/**
 * Execute the RPC calls: resolve lookup tables, fetch pre-simulation account
 * state, and run the simulation. Returns raw data for interpretation.
 */
async function runSimulation(rpc: SolanaRpc, message: VersionedMessage): Promise<RawSimulation> {
    const lookupTables = await resolveAddressLookupTables(rpc, message);
    const accountKeys = message.getAccountKeys({ addressLookupTableAccounts: lookupTables }).keySegments().flat();
    const addresses = accountKeys.map(key => toKitAddress(key));

    const [parsedAccountsPre, epochInfo] = await Promise.all([
        getMultipleParsedAccounts(rpc, addresses),
        rpc.getEpochInfo({ commitment: 'confirmed' }).send(),
    ]);

    // A v1 message must be sent in the v1 wire envelope (message first); the stock
    // VersionedTransaction envelope is signatures-first and nodes reject it for v1.
    const transaction =
        message instanceof V1MessageView ? new UnsignedV1WireTransaction(message) : new VersionedTransaction(message);
    const { value: simResult } = await rpc
        .simulateTransaction(toBase64(transaction.serialize()) as Base64EncodedWireTransaction, {
            accounts: {
                addresses,
                encoding: 'base64',
            },
            commitment: 'confirmed',
            encoding: 'base64',
            replaceRecentBlockhash: true,
        })
        .send();

    if (!simResult.accounts) {
        throw new Error('RPC did not return account data after simulation');
    }

    // Defensive: the RPC type allows `logs: null`, though in practice logs are
    // always present when accounts are returned.
    if (simResult.logs === null) {
        throw new Error('Expected to receive logs from simulation');
    }

    return {
        accountKeys,
        epoch: epochInfo.epoch,
        parsedAccountsPre,
        simResult: {
            accounts: simResult.accounts.map(account => (account ? toLegacySimulatedAccountInfo(account) : undefined)),
            // The RPC reports integers inside a transaction error (instruction index, custom program
            // error code) which kit upcasts to bigint; downstream consumers expect the web3.js shape.
            err: withNumbersInsteadOfBigInts(simResult.err) as TransactionError | null,
            logs: [...simResult.logs],
            unitsConsumed:
                simResult.unitsConsumed !== null && simResult.unitsConsumed !== undefined
                    ? Number(simResult.unitsConsumed)
                    : undefined,
        },
    };
}

type KitParsedAccount = {
    data: { parsed: unknown; program: string; space: bigint } | readonly [string, string];
    executable: boolean;
    lamports: bigint;
    owner: Address;
};

type KitSimulatedAccount = {
    data: readonly [string, string];
    executable: boolean;
    lamports: bigint;
    owner: Address;
};

/**
 * Fetch accounts in `jsonParsed` encoding and restate them in the web3.js
 * `getMultipleParsedAccounts` shape the interpretation helpers still consume: parsed JSON with
 * numbers where kit reports bigints, and raw data as a `Buffer` where the RPC could not parse.
 */
async function getMultipleParsedAccounts(
    rpc: SolanaRpc,
    addresses: Address[],
): Promise<(AccountInfo<ParsedAccountData | Buffer> | undefined)[]> {
    const { value } = await rpc
        .getMultipleAccounts(addresses, { commitment: 'confirmed', encoding: 'jsonParsed' })
        .send();
    return value.map(account => (account ? toLegacyAccountInfo(account) : undefined));
}

function isBase64Data(data: KitParsedAccount['data']): data is readonly [string, string] {
    return Array.isArray(data);
}

function toLegacyAccountInfo(account: KitParsedAccount): AccountInfo<ParsedAccountData | Buffer> {
    const data = isBase64Data(account.data)
        ? Buffer.from(account.data[0], 'base64')
        : {
              parsed: withNumbersInsteadOfBigInts(account.data.parsed),
              program: account.data.program,
              space: Number(account.data.space),
          };
    return {
        data,
        executable: account.executable,
        lamports: Number(account.lamports),
        owner: toLegacyPublicKey(account.owner),
    };
}

function toLegacySimulatedAccountInfo(account: KitSimulatedAccount): SimulatedTransactionAccountInfo {
    return {
        data: [account.data[0], account.data[1]],
        executable: account.executable,
        lamports: Number(account.lamports),
        owner: account.owner,
    };
}

/**
 * Interpret raw simulation data into user-facing results: token balance rows,
 * SOL balance changes, and parsed program logs.
 */
function interpretSimulation(
    { accountKeys, epoch, parsedAccountsPre, simResult }: RawSimulation,
    cluster: Cluster,
    accountBalances?: { preBalances: number[]; postBalances: number[] },
): SimulationResult {
    // Token balance data (raw — UI layer is responsible for generating display rows)
    const mintToDecimals = getMintDecimals(accountKeys, parsedAccountsPre, simResult.accounts);
    const tokenData = buildTokenBalances(accountKeys, parsedAccountsPre, simResult.accounts, mintToDecimals);

    const solChanges = computeSolBalanceChanges(accountKeys, parsedAccountsPre, simResult.accounts, accountBalances);

    let logs: InstructionLogs[] | undefined;
    let error: string | undefined;

    if (simResult.logs.length === 0 && typeof simResult.err === 'string') {
        // No logs to parse — surface the raw RPC error string (e.g. "AccountNotFound")
        error = simResult.err;
    } else {
        logs = parseProgramLogs(simResult.logs, simResult.err, cluster);

        // When logs are present alongside an error, the UI uses `error` to hide
        // SOL/token balance cards (unreliable after a failed tx) while still
        // showing the parsed logs so the user can diagnose the failure.
        if (simResult.err) {
            error = 'TransactionError';
        }
    }

    return {
        accountKeys,
        epoch,
        error,
        logs,
        solBalanceChanges: solChanges.length > 0 ? solChanges : undefined,
        tokenBalanceData: tokenData,
        unitsConsumed: simResult.unitsConsumed,
    };
}

/**
 * Bytes of account metadata the runtime charges for every account a transaction loads, on top of
 * that account's data length. An account that does not exist on chain is not charged at all.
 */
const ACCOUNT_METADATA_SIZE = 64;

const MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED = 'MaxLoadedAccountsDataSizeExceeded';

/** Owner of every upgradeable program account, whose executable code lives in a separate account. */
const UPGRADEABLE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

/**
 * Restates a loaded accounts data size failure as the arithmetic behind it, or `undefined` when
 * that cannot be established.
 *
 * The runtime reports `MaxLoadedAccountsDataSizeExceeded` with the size it loaded clamped to the
 * transaction's own limit — never the size it needed — so the response cannot say how far over the
 * transaction was. v1 makes that worse: the limits live in the message and one left unset is zero,
 * where legacy and v0 fell back to a generous default, so the limit is as likely to be missing or
 * too small as the transaction is to be too large.
 *
 * The runtime charges each account it loads 64 bytes of metadata plus its data, and charges nothing
 * for an account that does not exist. Calling an upgradeable program loads its program data account
 * as well, which the message usually does not list, so those are fetched here to be counted. A
 * message that does list one is charged for it once, like any other account it names.
 *
 * The total is a floor rather than the figure the runtime reached: a program a message reaches by
 * cross-program invocation is loaded and charged without ever being named, and cannot be found
 * without executing the transaction. A total that already clears the limit explains the failure on
 * its own; one that does not is reported as the floor it is, and names what the rest must be.
 */
async function explainLoadedAccountsDataSize(
    rpc: SolanaRpc,
    message: V1MessageView,
    accountKeys: PublicKey[],
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[],
): Promise<string | undefined> {
    const messageAccounts = parsedAccountsPre.filter(account => account !== undefined);
    const listedAddresses = new Set(accountKeys.map(key => key.toBase58()));

    let programDataAccounts;
    try {
        programDataAccounts = await fetchProgramDataAccounts(rpc, messageAccounts, listedAddresses);
    } catch (cause) {
        Logger.error(new Error('Failed to load program data accounts', { cause }));
        return undefined;
    }

    const loadedAccounts = [...messageAccounts, ...programDataAccounts];
    const dataSize = loadedAccounts.reduce((total, account) => total + accountDataSize(account), 0);
    const loadedSize = dataSize + loadedAccounts.length * ACCOUNT_METADATA_SIZE;
    const limit = message.transactionConfig?.loadedAccountsDataSizeLimit;

    const accountCount = `${loadedAccounts.length} account${loadedAccounts.length === 1 ? '' : 's'}`;
    const fitsUnderLimit = limit !== undefined && loadedSize <= limit;
    const measured = fitsUnderLimit ? `at least ${format(loadedSize)}` : format(loadedSize);
    const loads = `this transaction loads ${measured} bytes (${format(dataSize)} bytes of account data, plus ${ACCOUNT_METADATA_SIZE} bytes of metadata for each of the ${accountCount} it names)`;

    let cap;
    if (limit === undefined) {
        cap = 'this v1 message sets no loaded accounts data size limit, which v1 reads as a limit of zero bytes';
    } else if (fitsUnderLimit) {
        cap = `within the ${format(limit)} byte limit set in the v1 message config, so the rest of the limit went to accounts the message does not name — a program reached by cross-program invocation, and the program data behind it, are loaded and charged the same way`;
    } else {
        cap = `above the ${format(limit)} byte limit set in the v1 message config`;
    }

    return `${MAX_LOADED_ACCOUNTS_DATA_SIZE_EXCEEDED} — ${loads}, ${cap}.`;
}

/**
 * The program data accounts behind whichever of `accounts` are upgradeable programs, skipping any
 * address in `listedAddresses` so that an account the message already names is not counted twice.
 *
 * The upgradeable loader owns program data and buffer accounts as well as the programs themselves,
 * and only a program account holds a program data address, so the executable flag selects them.
 */
async function fetchProgramDataAccounts(
    rpc: SolanaRpc,
    accounts: AccountInfo<ParsedAccountData | Buffer>[],
    listedAddresses: Set<string>,
): Promise<AccountInfo<ParsedAccountData | Buffer>[]> {
    const addresses = new Map<string, PublicKey>();

    for (const account of accounts) {
        if (!account.executable || !account.owner.equals(UPGRADEABLE_LOADER_ID)) {
            continue;
        }

        const address = programDataAddress(account);
        if (address !== undefined && !listedAddresses.has(address.toBase58())) {
            addresses.set(address.toBase58(), address);
        }
    }

    if (addresses.size === 0) {
        return [];
    }

    const value = await getMultipleParsedAccounts(
        rpc,
        [...addresses.values()].map(key => toKitAddress(key)),
    );
    return value.filter(account => account !== undefined);
}

/**
 * The program data account an upgradeable program account points at.
 *
 * The account holds a 4-byte state discriminant followed by that address, which the RPC surfaces
 * directly when it parses the account and leaves in the raw bytes when it does not.
 */
function programDataAddress(account: AccountInfo<ParsedAccountData | Buffer>): PublicKey | undefined {
    if (Buffer.isBuffer(account.data)) {
        return account.data.length >= 36 ? new PublicKey(account.data.subarray(4, 36)) : undefined;
    }

    const programData = (account.data.parsed as { info?: { programData?: string } })?.info?.programData;
    return programData === undefined ? undefined : new PublicKey(programData);
}

/**
 * The on-chain size of an account as the runtime counts it. A parsed account reports its size
 * directly; one the RPC could not parse arrives as its raw data.
 */
function accountDataSize(account: AccountInfo<ParsedAccountData | Buffer>): number {
    return Buffer.isBuffer(account.data) ? account.data.length : account.data.space;
}

function format(value: number): string {
    return value.toLocaleString('en-US');
}
