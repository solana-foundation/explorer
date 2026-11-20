import type { InstructionLogs } from './parse-program-logs';

/**
 * Returns the log entry of each instruction, or `undefined` for an instruction with no entry.
 * Matches by program address because a precompile logs nothing, so the entries can be fewer than the instructions.
 */
export function pairLogsWithInstructions(
    logs: readonly InstructionLogs[],
    programAddresses: readonly string[],
): (InstructionLogs | undefined)[] {
    let logIndex = 0;

    return programAddresses.map(programAddress => {
        const entry = logs[logIndex];
        if (!entry || !isLoggedBy(entry, programAddress)) return undefined;

        logIndex++;
        return entry;
    });
}

function isLoggedBy(entry: InstructionLogs, programAddress: string): boolean {
    if (entry.invokedProgram === null) {
        return entry.logs.length > 0 && NATIVE_PROGRAMS_MISSING_INVOKE_LOG.includes(programAddress);
    }

    return entry.invokedProgram === programAddress;
}

const NATIVE_PROGRAMS_MISSING_INVOKE_LOG: readonly string[] = [
    'AddressLookupTab1e1111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
    'BPFLoader1111111111111111111111111111111111',
    'BPFLoader2111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
];
