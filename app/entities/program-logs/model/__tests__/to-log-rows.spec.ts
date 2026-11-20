import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { baseLogs, errorLogs } from '../mocks/logs';
import { parseProgramLogs } from '../parse-program-logs';
import { toInstructionLogRows } from '../to-log-rows';

const VOTING = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';
const SYSTEM = '11111111111111111111111111111111';
const ED25519 = 'Ed25519SigVerify111111111111111111111111111';

describe('toInstructionLogRows', () => {
    it('should indent the lines of an inner invocation', () => {
        const [row] = toRows({ lines: baseLogs, programAddresses: [VOTING] });

        expect(row.status).toBe('success');
        expect(row.lines.map(line => `${line.prefix}${line.text} [${line.style}]`)).toEqual([
            '> Program logged: "Instruction: InitializePoll" [muted]',
            '> Program invoked: System Program [info]',
            '  > Program returned success [success]',
            '> Program consumed: 7617 of 200000 compute units [muted]',
            '> Program returned success [success]',
        ]);
    });

    it('should mark a row failed when an inner invocation failed', () => {
        const [row] = toRows({ lines: errorLogs, programAddresses: [VOTING] });

        expect(row.status).toBe('failed');
        expect(row.lines.filter(line => line.style === 'warning').map(line => line.text)).toEqual([
            'Program returned error: "custom program error: 0x0"',
            'Program returned error: "custom program error: 0x0"',
        ]);
    });

    // Truncated logs can end before the failure line of the outer invocation.
    it('should mark a row failed when the logs end after the failure of an inner invocation', () => {
        const [row] = toRows({ lines: errorLogs.slice(0, 5), programAddresses: [VOTING] });

        expect(row.status).toBe('failed');
    });

    it('should show a row with no lines for an instruction that logged nothing', () => {
        const rows = toRows({ lines: baseLogs, programAddresses: [ED25519, VOTING] });

        expect(rows[0]).toEqual({ lines: [], status: 'none' });
        expect(rows[1].status).toBe('success');
    });

    // The entries are fewer than the instructions, so the error index is an instruction index, not an entry index.
    it('should show the transaction error on the instruction it names when the logs have no failure', () => {
        const rows = toRows({
            error: { index: 2, message: 'insufficient funds for instruction' },
            lines: [`Program ${SYSTEM} invoke [1]`, `Program ${SYSTEM} success`],
            programAddresses: [ED25519, SYSTEM, SYSTEM],
        });

        expect(rows.map(row => row.status)).toEqual(['none', 'success', 'failed']);
        expect(rows[2].lines).toEqual([
            { prefix: '> ', style: 'warning', text: 'Runtime error: insufficient funds for instruction' },
        ]);
    });

    it('should not repeat the transaction error on an instruction whose logs show the failure', () => {
        const [row] = toRows({
            error: { index: 0, message: 'custom program error: 0x0' },
            lines: errorLogs,
            programAddresses: [VOTING],
        });

        expect(row.lines.some(line => line.text.startsWith('Runtime error'))).toBe(false);
    });

    it('should mark a row failed when the runtime logs an error with no status line', () => {
        const [row] = toRows({
            lines: [
                `Program ${VOTING} invoke [1]`,
                'Program failed to complete: exceeded CUs meter at BPF instruction',
            ],
            programAddresses: [VOTING],
        });

        expect(row).toEqual({
            lines: [
                {
                    prefix: '> ',
                    style: 'warning',
                    text: 'Program returned error: "exceeded CUs meter at BPF instruction"',
                },
            ],
            status: 'failed',
        });
    });

    describe('with no instructions', () => {
        it('should return one row for each top-level invocation', () => {
            const rows = toRows({
                error: { index: 1, message: 'insufficient funds for instruction' },
                lines: [`Program ${VOTING} invoke [1]`, `Program ${VOTING} success`, `Program ${SYSTEM} invoke [1]`],
                programAddresses: undefined,
            });

            expect(rows.map(row => row.status)).toEqual(['success', 'failed']);
        });

        it('should return one failed row for a transaction error with no logs', () => {
            const rows = toRows({
                error: { index: 0, message: 'invalid account data for instruction' },
                lines: [],
                programAddresses: undefined,
            });

            expect(rows).toEqual([
                {
                    lines: [
                        { prefix: '> ', style: 'warning', text: 'Runtime error: invalid account data for instruction' },
                    ],
                    status: 'failed',
                },
            ]);
        });
    });
});

function toRows({
    error,
    lines,
    programAddresses,
}: {
    error?: { index: number; message: string };
    lines: string[];
    programAddresses: string[] | undefined;
}) {
    return toInstructionLogRows({
        cluster: Cluster.Mainnet,
        error,
        instructions: programAddresses?.map(address => ({ programId: { toBase58: () => address } })),
        logs: parseProgramLogs(lines),
    });
}
