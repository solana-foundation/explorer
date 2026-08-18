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
    return interpretSimulation(raw, cluster, accountBalances);
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
        epoch: BigInt(epochInfo.epoch),
        error,
        logs,
        solBalanceChanges: solChanges.length > 0 ? solChanges : undefined,
        tokenBalanceData: tokenData,
        unitsConsumed: simResult.unitsConsumed,
    };
}
