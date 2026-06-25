import type { SimulatedTransactionResponse } from '@solana/web3.js';
import type { InstructionLogs } from '@utils/program-logs';

// Options controlling how an instruction is executed.
export type ExecutionOptions = {
    /** When true, run preflight simulation before broadcasting (skipPreflight: false). Defaults to false. */
    simulate: boolean;
};

// Program logs carried on a result, in both forms: raw RPC lines and parsed rows.
// Parsed at result construction so the render layer only renders, never parses.
export type ResultLogs = {
    raw: string[];
    parsed: InstructionLogs[];
};

// Instruction Execution

export type InstructionExecutionResult = ExecutionOkResult | ExecutionErrResult;
export type ExecutionErrResult = BroadcastFailedResult | PreBroadcastFailedResult;

export type ExecutionOkResult = {
    kind: 'execution';
    status: 'success';
    signature: string;
    logs: ResultLogs;
    finishedAt: Date;
};

// Tx was broadcast (sendRawTransaction resolved a signature).
// Either on-chain confirmation returned err, OR confirm/getTransaction failed afterward.
// Tx exists or may still land; tx link is valid either way.
export type BroadcastFailedResult = {
    kind: 'execution';
    status: 'error';
    phase: 'broadcast_failed';
    signature: string;
    serializedTxMessage: string;
    message: string;
    logs: ResultLogs;
    finishedAt: Date;
};

// Local error before the tx was broadcast (buildTx threw, wallet rejected sign, sendRawTransaction threw).
// Inspector link available only when a tx was built and serialized without errors.
// No signature.
export type PreBroadcastFailedResult = {
    kind: 'execution';
    status: 'error';
    phase: 'pre_broadcast_failed';
    serializedTxMessage: string | undefined;
    message: string;
    logs: ResultLogs;
    finishedAt: Date;
};

// Instruction Simulation
export type InstructionSimulationResult = SimulationOkResult | SimulationErrResult;
export type SimulationErrResult = RpcSimulationFailedResult | SimulationExecutionFailedResult;

export type SimulationOkResult = {
    kind: 'simulation';
    status: 'success';
    serializedTxMessage: string;
    unitsConsumed: number | undefined;
    // Producer assigns `result.value.returnData ?? undefined`, so include `| undefined` explicitly
    returnData: SimulatedTransactionResponse['returnData'] | undefined;
    logs: ResultLogs;
    finishedAt: Date;
};

// RPC's simulateTransaction returned with err — chain-reported failure, RPC logs included.
export type RpcSimulationFailedResult = {
    kind: 'simulation';
    status: 'error';
    phase: 'rpc_simulation_failed';
    serializedTxMessage: string;
    message: string;
    logs: ResultLogs;
    finishedAt: Date;
};

// Local error before/during the simulate RPC call (buildTx threw, getLatestBlockhash threw, simulate threw).
// Inspector link available only when a tx was built and serialized without errors.
// No logs.
export type SimulationExecutionFailedResult = {
    kind: 'simulation';
    status: 'error';
    phase: 'simulation_execution_failed';
    serializedTxMessage: string | undefined;
    message: string;
    finishedAt: Date;
};
