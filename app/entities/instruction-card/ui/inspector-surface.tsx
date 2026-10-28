import type { InstructionSurface } from '../model/surface';

export function inspectorSurface({
    Card,
    instructionData,
}: Pick<InstructionSurface, 'Card' | 'instructionData'>): InstructionSurface {
    return {
        Card,
        collapsible: true,
        instructionData,
        rawInstructions: undefined,
        // eslint-disable-next-line unicorn/no-null -- SignatureResult.err is `TransactionError | null`
        result: { err: null },
        signature: undefined,
        // An inspected message has not run, so the Raw view checks the program it calls.
        validateProgram: true,
    };
}
