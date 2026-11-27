import { describe, expect, it } from 'vitest';

import { pairLogsWithInstructions } from '../pair-logs-with-instructions';
import { type Invocation, parseProgramLogs } from '../parse-program-logs';

const SECP256R1 = 'Secp256r1SigVerify1111111111111111111111111';
const PROGRAM = 'AM4L8ZAkTXANjmCK42TUjtXuyV1qwXdqF1YVFbJibTS9';
const UPGRADEABLE_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';

describe('pairLogsWithInstructions', () => {
    it('should give a precompile no invocation and keep each later invocation on its own instruction', () => {
        const { invocations } = parseProgramLogs([
            `Program ${PROGRAM} invoke [1]`,
            `Program ${PROGRAM} consumed 42835 of 1000000 compute units`,
            `Program ${PROGRAM} success`,
            `Program ${PROGRAM} invoke [1]`,
            `Program ${PROGRAM} consumed 41335 of 957165 compute units`,
            `Program ${PROGRAM} success`,
        ]);

        const paired = pairLogsWithInstructions(invocations, [SECP256R1, PROGRAM, SECP256R1, PROGRAM]);

        expect(paired.map(invocation => invocation?.computeUnits)).toEqual([undefined, 42835, undefined, 41335]);
    });

    it('should give no invocation to an instruction after the last logged one', () => {
        const paired = pairLogsWithInstructions([invocation(PROGRAM)], [PROGRAM, PROGRAM]);

        expect(paired).toEqual([invocation(PROGRAM), undefined]);
    });

    it('should give lines with no invoke line to a native program that logs none', () => {
        const { invocations } = parseProgramLogs(['Upgraded program BqNztJFVm4BCJUQmbQGBDmPM855gxUXkDByF7GKyCpv8']);

        expect(pairLogsWithInstructions(invocations, [UPGRADEABLE_LOADER])).toEqual(invocations);
        expect(pairLogsWithInstructions(invocations, [PROGRAM])).toEqual([undefined]);
    });

    it('should skip every block of lines with no invoke line that precedes the invocation of the instruction', () => {
        const { invocations } = parseProgramLogs([
            `Program ${PROGRAM} success`,
            `Program ${PROGRAM} success`,
            `Program ${PROGRAM} invoke [1]`,
            `Program ${PROGRAM} success`,
        ]);

        expect(pairLogsWithInstructions(invocations, [PROGRAM])).toEqual([invocations[2]]);
    });
});

function invocation(programAddress: string): Invocation {
    return { computeUnits: undefined, entries: [], programAddress };
}
