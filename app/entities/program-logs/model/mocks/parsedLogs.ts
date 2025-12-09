import type { InstructionLogs } from '@/app/utils/program-logs';

// TODO: These logs should be derived from the original logs (string[]),
// but the current formatter (@/app/utils/program-logs) has too many dependencies.
export const parsedBaseLogs: InstructionLogs[] = [
    {
        computeUnits: 7617,
        failed: false,
        invokedProgram: 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye',
        logs: [
            {
                prefix: '> ',
                style: 'muted',
                text: 'Program logged: "Instruction: InitializePoll"',
            },
            {
                prefix: '> ',
                style: 'info',
                text: 'Program invoked: System Program',
            },
            {
                prefix: '  > ',
                style: 'success',
                text: 'Program returned success',
            },
            {
                prefix: '> ',
                style: 'muted',
                text: 'Program consumed: 7617 of 200000 compute units',
            },
            {
                prefix: '> ',
                style: 'success',
                text: 'Program returned success',
            },
        ],
        truncated: false,
    },
];

export const parsedErrorLogs: InstructionLogs[] = [
    {
        computeUnits: 6929,
        failed: true,
        invokedProgram: 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqDJvn41ye',
        logs: [
            {
                prefix: '> ',
                style: 'muted',
                text: 'Program logged: "Instruction: InitializePoll"',
            },
            {
                prefix: '> ',
                style: 'info',
                text: 'Program invoked: System Program',
            },
            {
                prefix: '  > ',
                style: 'muted',
                text: 'Allocate: account Address { address: 3TXjgWcgdGA2XcmEku4tnYxqXSSEEKTz6eDyekksh8pH, base: None } already in use',
            },
            {
                prefix: '  > ',
                style: 'warning',
                text: 'Program returned error: "custom program error: 0x0"',
            },
            {
                prefix: '> ',
                style: 'muted',
                text: 'Program consumed: 6929 of 200000 compute units',
            },
            {
                prefix: '> ',
                style: 'warning',
                text: 'Program returned error: "custom program error: 0x0"',
            },
        ],
        truncated: false,
    },
];
