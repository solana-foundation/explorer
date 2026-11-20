import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { pairLogsWithInstructions } from '../pair-logs-with-instructions';
import { type InstructionLogs, parseProgramLogs } from '../parse-program-logs';

const SECP256R1 = 'Secp256r1SigVerify1111111111111111111111111';
const PROGRAM = 'AM4L8ZAkTXANjmCK42TUjtXuyV1qwXdqF1YVFbJibTS9';
const UPGRADEABLE_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';

describe('pairLogsWithInstructions', () => {
    // The first four instructions of devnet transaction 2Y9isGXjmvfUvHLcDqrS485Wy74eexPKC2WNMZFzHzBc8dNA1TXdjH6hhCs1dFGcvdUV1bST8ZgA8sLDdkgbDDhm.
    it('should give a precompile no entry and keep each later entry on its own instruction', () => {
        const logs = parseProgramLogs(
            [
                `Program ${PROGRAM} invoke [1]`,
                `Program ${PROGRAM} consumed 42835 of 1000000 compute units`,
                `Program ${PROGRAM} success`,
                `Program ${PROGRAM} invoke [1]`,
                `Program ${PROGRAM} consumed 41335 of 957165 compute units`,
                `Program ${PROGRAM} success`,
            ],
            null,
            Cluster.Devnet,
        );

        const paired = pairLogsWithInstructions(logs, [SECP256R1, PROGRAM, SECP256R1, PROGRAM]);

        expect(paired.map(entry => entry?.computeUnits)).toEqual([undefined, 42835, undefined, 41335]);
    });

    it('should give no entry to an instruction after the last logged one', () => {
        const paired = pairLogsWithInstructions([entry(PROGRAM)], [PROGRAM, PROGRAM]);

        expect(paired).toEqual([entry(PROGRAM), undefined]);
    });

    it('should give an entry with no invoked program to a native program that logs no invoke line', () => {
        const upgradeLogs: InstructionLogs = {
            ...entry(null),
            logs: [{ prefix: '> ', style: 'muted', text: 'Upgraded program' }],
        };

        expect(pairLogsWithInstructions([upgradeLogs], [UPGRADEABLE_LOADER])).toEqual([upgradeLogs]);
        expect(pairLogsWithInstructions([upgradeLogs], [PROGRAM])).toEqual([undefined]);
    });
});

function entry(invokedProgram: string | null): InstructionLogs {
    return { computeUnits: 0, failed: false, invokedProgram, logs: [], truncated: false };
}
