import type { SimulatedTransactionResponse } from '@solana/web3.js';

// Options controlling how an instruction is executed.
export type ExecutionOptions = {
    /** When true, run preflight simulation before broadcasting (skipPreflight: false). Defaults to false. */
    simulate: boolean;
};

// Instruction Execution

export type InstructionExecutionResult = ExecutionOkResult | ExecutionErrResult;
export type ExecutionErrResult = BroadcastFailedResult | PreBroadcastFailedResult;

export type ExecutionOkResult = {
    status: 'success';
    signature: string;
    logs: string[];
    finishedAt: Date;
};

// Tx was broadcast (sendRawTransaction resolved a signature).
// Either on-chain confirmation returned err, OR confirm/getTransaction failed afterward.
// Tx exists or may still land; tx link is valid either way.
export type BroadcastFailedResult = {
    status: 'error';
    phase: 'broadcast_failed';
    signature: string;
    serializedTxMessage: string;
    message: string;
    logs: string[];
    finishedAt: Date;
};

// Local error before the tx was broadcast (buildTx threw, wallet rejected sign, sendRawTransaction threw).
// Inspector link available only when a tx was built and serialized without errors.
// No signature.
export type PreBroadcastFailedResult = {
    status: 'error';
    phase: 'pre_broadcast_failed';
    serializedTxMessage: string | undefined;
    message: string;
    logs: string[];
    finishedAt: Date;
};

// Instruction Simulation
export type InstructionSimulationResult = SimulationOkResult | SimulationErrResult;
export type SimulationErrResult = RpcSimulationFailedResult | SimulationExecutionFailedResult;

export type SimulationOkResult = {
    status: 'success';
    serializedTxMessage: string;
    unitsConsumed: number | undefined;
    // Producer assigns `result.value.returnData ?? undefined`, so include `| undefined` explicitly
    returnData: SimulatedTransactionResponse['returnData'] | undefined;
    logs: string[];
    finishedAt: Date;
};

// RPC's simulateTransaction returned with err — chain-reported failure, RPC logs included.
export type RpcSimulationFailedResult = {
    status: 'error';
    phase: 'rpc_simulation_failed';
    serializedTxMessage: string;
    message: string;
    logs: string[];
    finishedAt: Date;
};

// Local error before/during the simulate RPC call (buildTx threw, getLatestBlockhash threw, simulate threw).
// Inspector link available only when a tx was built and serialized without errors.
// No logs.
export type SimulationExecutionFailedResult = {
    status: 'error';
    phase: 'simulation_execution_failed';
    serializedTxMessage: string | undefined;
    message: string;
    finishedAt: Date;
};
