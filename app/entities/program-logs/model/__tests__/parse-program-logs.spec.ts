import { describe, expect, it } from 'vitest';

import { getLoggedComputeUnits, parseProgramLogs } from '../parse-program-logs';

const A = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';
const SYSTEM = '11111111111111111111111111111111';

describe('parseProgramLogs', () => {
    it('should nest an inner invocation in the invocation that made it', () => {
        const logs = parseProgramLogs([
            `Program ${A} invoke [1]`,
            'Program log: Instruction: InitializePoll',
            `Program ${SYSTEM} invoke [2]`,
            `Program ${SYSTEM} success`,
            'Program data: AAAAAAAAAAAA',
            `Program ${A} consumed 7617 of 200000 compute units`,
            `Program ${A} success`,
        ]);

        expect(logs).toEqual({
            invocations: [
                {
                    computeUnits: 7617,
                    entries: [
                        { kind: 'log', text: 'Instruction: InitializePoll' },
                        {
                            invocation: {
                                computeUnits: undefined,
                                entries: [{ kind: 'success' }],
                                programAddress: SYSTEM,
                            },
                            kind: 'invocation',
                        },
                        { kind: 'data', text: 'AAAAAAAAAAAA' },
                        { kind: 'consumed', text: '7617 of 200000 compute units' },
                        { kind: 'success' },
                    ],
                    programAddress: A,
                },
            ],
            truncated: false,
        });
    });

    it('should start a top-level invocation for each instruction', () => {
        const logs = parseProgramLogs([
            `Program ${SYSTEM} invoke [1]`,
            `Program ${SYSTEM} success`,
            `Program ${A} invoke [1]`,
            `Program ${A} failed: custom program error: 0x0`,
        ]);

        expect(logs.invocations.map(invocation => invocation.programAddress)).toEqual([SYSTEM, A]);
        expect(logs.invocations[1].entries).toEqual([{ kind: 'failed', text: 'custom program error: 0x0' }]);
    });

    // A status word in a program's own text is not a status line.
    it.each(['Program return: B successsuccess', 'Program log: request failed', 'Program data: success'])(
        'should keep the invocation open after "%s"',
        line => {
            const logs = parseProgramLogs([`Program ${A} invoke [1]`, line, 'Program data: AAAAAAAAAAAA']);

            expect(logs.invocations).toHaveLength(1);
            expect(logs.invocations[0].entries).toHaveLength(2);
        },
    );

    it('should put a line that no invocation precedes in an invocation with no program address', () => {
        const logs = parseProgramLogs(['Program log: before any invocation', `Program ${A} invoke [1]`]);

        expect(logs.invocations).toEqual([
            {
                computeUnits: undefined,
                entries: [{ kind: 'log', text: 'before any invocation' }],
                programAddress: undefined,
            },
            { computeUnits: undefined, entries: [], programAddress: A },
        ]);
    });

    it('should put an error that follows a status line in the invocation of that status line', () => {
        const logs = parseProgramLogs([
            `Program ${A} invoke [1]`,
            `Program ${A} success`,
            'failed to verify account 3TXjgWcgdGa7XcmEku4tnYxqXSSEEKTz6eDyekksh8pH: instruction modified data',
        ]);

        expect(logs.invocations).toHaveLength(1);
        expect(logs.invocations[0].entries.at(-1)).toEqual({
            kind: 'error',
            text: 'failed to verify account 3TXjgWcgdGa7XcmEku4tnYxqXSSEEKTz6eDyekksh8pH: instruction modified data',
        });
    });

    it('should start a top-level invocation for an invoke line with depth 0', () => {
        const logs = parseProgramLogs([`Program ${A} invoke [1]`, `Program ${SYSTEM} invoke [0]`]);

        expect(logs.invocations.map(invocation => invocation.programAddress)).toEqual([A, SYSTEM]);
    });

    it('should report truncated logs and keep the lines before the truncation', () => {
        const logs = parseProgramLogs([`Program ${A} invoke [1]`, 'Log truncated']);

        expect(logs.truncated).toBe(true);
        expect(logs.invocations).toHaveLength(1);
    });

    it('should return no invocations for no lines', () => {
        expect(parseProgramLogs([])).toEqual({ invocations: [], truncated: false });
    });
});

describe('getLoggedComputeUnits', () => {
    it('should add the figures of the top-level invocations only', () => {
        const logs = parseProgramLogs([
            `Program ${SYSTEM} invoke [1]`,
            `Program ${SYSTEM} success`,
            `Program ${A} invoke [1]`,
            `Program ${A} invoke [2]`,
            `Program ${A} consumed 100 of 1000 compute units`,
            `Program ${A} success`,
            `Program ${A} consumed 7617 of 200000 compute units`,
            `Program ${A} success`,
        ]);

        expect(getLoggedComputeUnits(logs)).toBe(7617);
    });

    it('should return no figure for a transaction with no logs', () => {
        expect(getLoggedComputeUnits(parseProgramLogs([]))).toBeUndefined();
    });
});
