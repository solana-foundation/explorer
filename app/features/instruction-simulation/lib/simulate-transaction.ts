import type {
    AccountInfo,
    Connection,
    ParsedAccountData,
    PublicKey,
    SimulatedTransactionAccountInfo,
    TransactionError,
    VersionedMessage,
} from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';
import type { Cluster } from '@utils/cluster';
import { type InstructionLogs, parseProgramLogs } from '@utils/program-logs';

import { UnsignedV1WireTransaction, V1MessageView } from '@/app/shared/lib/v1-message-bridge';

import { buildTokenBalances, type TokenBalanceData } from './build-token-balances';
import { computeSolBalanceChanges } from './compute-sol-balance-changes';
import { getMintDecimals } from './get-mint-decimals';
import { resolveAddressLookupTables } from './resolve-address-lookup-tables';
import { ENABLE_TX_V1_FEATURE, isTxV1Active } from './tx-v1-feature';
import type { SolBalanceChange } from './types';

export type SimulationResult = {
    epoch: bigint;
    logs: InstructionLogs[] | undefined;
    error: string | undefined;
    solBalanceChanges: SolBalanceChange[] | undefined;
    tokenBalanceData: TokenBalanceData | undefined;
    unitsConsumed: number | undefined;
};

type SimulateOptions = {
    connection: Connection;
    message: VersionedMessage;
    cluster: Cluster;
    accountBalances?: { preBalances: number[]; postBalances: number[] };
};

/**
 * Run a transaction simulation against the given RPC connection and return
 * parsed results (logs, SOL changes, token balance rows, etc.).
 */
export async function simulateTransaction({
    connection,
    message,
    cluster,
    accountBalances,
}: SimulateOptions): Promise<SimulationResult> {
    const raw = await runSimulation(connection, message);
    return interpretSimulation(raw, cluster, message, accountBalances);
}

type RawSimulation = {
    accountKeys: PublicKey[];
    epochInfo: { epoch: number };
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
async function runSimulation(connection: Connection, message: VersionedMessage): Promise<RawSimulation> {
    // A node whose runtime predates the v1 feature gate rejects the transaction during sanitization
    // and answers with a bare `UnsupportedVersion` error and no logs, which reads as a failure of
    // the transaction rather than of the cluster. Check the gate first so the cause is explicit.
    if (message instanceof V1MessageView && !(await isTxV1Active(connection))) {
        throw new Error(
            `this cluster does not support v1 transactions yet — feature gate ${ENABLE_TX_V1_FEATURE.toBase58()} is not active`,
        );
    }

    const lookupTables = await resolveAddressLookupTables(connection, message);
    const accountKeys = message.getAccountKeys({ addressLookupTableAccounts: lookupTables }).keySegments().flat();

    const [parsedAccountsPre, epochInfo] = await Promise.all([
        connection.getMultipleParsedAccounts(accountKeys),
        connection.getEpochInfo(),
    ]);

    // A v1 message must be sent in the v1 wire envelope (message first); the stock
    // VersionedTransaction envelope is signatures-first and nodes reject it for v1.
    const transaction =
        message instanceof V1MessageView ? new UnsignedV1WireTransaction(message) : new VersionedTransaction(message);
    const { value: simResult } = await connection.simulateTransaction(transaction, {
        accounts: {
            addresses: accountKeys.map(key => key.toBase58()),
            encoding: 'base64',
        },
        replaceRecentBlockhash: true,
    });

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
        epochInfo,
        parsedAccountsPre: parsedAccountsPre.value.map(a => a ?? undefined),
        simResult: {
            accounts: simResult.accounts.map(a => a ?? undefined),
            err: simResult.err,
            logs: simResult.logs,
            unitsConsumed: simResult.unitsConsumed,
        },
    };
}

/**
 * Interpret raw simulation data into user-facing results: token balance rows,
 * SOL balance changes, and parsed program logs.
 */
function interpretSimulation(
    { accountKeys, epochInfo, parsedAccountsPre, simResult }: RawSimulation,
    cluster: Cluster,
    message: VersionedMessage,
    accountBalances?: { preBalances: number[]; postBalances: number[] },
): SimulationResult {
    // Token balance data (raw — UI layer is responsible for generating display rows)
    const mintToDecimals = getMintDecimals(accountKeys, parsedAccountsPre, simResult.accounts);
    const tokenData = buildTokenBalances(accountKeys, parsedAccountsPre, simResult.accounts, mintToDecimals);

    const solChanges = computeSolBalanceChanges(accountKeys, parsedAccountsPre, simResult.accounts, accountBalances);

    let logs: InstructionLogs[] | undefined;
    let error: string | undefined;

    if (simResult.logs.length === 0 && typeof simResult.err === 'string') {
        // No logs to parse — surface the RPC error string (e.g. "AccountNotFound")
        error = explainSimulationError(simResult.err, message, parsedAccountsPre);
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
        epoch: BigInt(epochInfo.epoch),
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

/**
 * Expands an RPC error string with the cause when the transaction version explains it.
 *
 * The runtime reports `MaxLoadedAccountsDataSizeExceeded` whenever a transaction loads more account
 * data than its limit allows, and reports the size it loaded clamped to that limit — never the size
 * it needed. v1 moved the resource limits into the message and made every one of them explicit: a
 * limit the message leaves unset is zero, where legacy and v0 fell back to a generous default. So
 * on a v1 message the limit is as likely to be missing or too small as the transaction is to be too
 * large, and nothing in the error says so. Do the arithmetic the runtime did instead, from the
 * accounts already fetched for the simulation.
 */
function explainSimulationError(
    err: string,
    message: VersionedMessage,
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[],
): string {
    if (err !== 'MaxLoadedAccountsDataSizeExceeded' || !(message instanceof V1MessageView)) {
        return err;
    }

    const existingAccounts = parsedAccountsPre.filter(account => account !== undefined);
    const dataSize = existingAccounts.reduce((total, account) => total + accountDataSize(account), 0);
    const loadedSize = dataSize + existingAccounts.length * ACCOUNT_METADATA_SIZE;
    const limit = message.transactionConfig?.loadedAccountsDataSizeLimit;

    const size = `this transaction loads ${format(loadedSize)} bytes (${format(dataSize)} bytes of account data, plus ${ACCOUNT_METADATA_SIZE} bytes of metadata for each of the ${existingAccounts.length} accounts that exist on chain)`;
    const cap =
        limit === undefined
            ? 'this v1 message sets no loaded accounts data size limit, which v1 reads as a limit of zero bytes'
            : `above the ${format(limit)} byte limit set in the v1 message config`;

    return `${err} — ${size}, ${cap}.`;
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
