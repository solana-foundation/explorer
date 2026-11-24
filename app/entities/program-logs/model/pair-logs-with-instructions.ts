import type { Invocation } from './parse-program-logs';

export function pairLogsWithInstructions(
    invocations: readonly Invocation[],
    programAddresses: readonly string[],
): (Invocation | undefined)[] {
    let next = 0;

    return programAddresses.map(programAddress => {
        const skipsOrphan =
            invocations[next]?.programAddress === undefined && !isLoggedBy(invocations[next], programAddress);
        const index = skipsOrphan ? next + 1 : next;
        if (!isLoggedBy(invocations[index], programAddress)) return undefined;

        next = index + 1;
        return invocations[index];
    });
}

function isLoggedBy(invocation: Invocation | undefined, programAddress: string): boolean {
    if (!invocation) return false;
    if (invocation.programAddress === undefined) {
        return invocation.entries.length > 0 && NATIVE_PROGRAMS_MISSING_INVOKE_LOG.includes(programAddress);
    }

    return invocation.programAddress === programAddress;
}

const NATIVE_PROGRAMS_MISSING_INVOKE_LOG: readonly string[] = [
    'AddressLookupTab1e1111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
    'BPFLoader1111111111111111111111111111111111',
    'BPFLoader2111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
];
