import type { TransactionError } from '@solana/web3.js';

import { getTransactionInstructionError } from '@/app/utils/program-err';

import type { BaseIdl } from '../unified-program';

export function formatTransactionError(err: TransactionError, idlErrors: BaseIdl['errors'] | undefined): string {
    const programError = getTransactionInstructionError(err);
    if (programError) {
        const instructionNum = programError.index + 1;
        const customCode = extractCustomErrorCode(err);
        const idlError = customCode !== undefined ? resolveIdlError(customCode, idlErrors) : undefined;
        const errorMessage = idlError ? `"${idlError.name}" (code:${customCode})` : programError.message;
        return `Instruction #${instructionNum} got ${errorMessage}. See logs for details`;
    }
    return `Transaction failed: "${JSON.stringify(err)}". See logs for details`;
}

function extractCustomErrorCode(error: TransactionError | null): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    if (!('InstructionError' in error)) return undefined;
    const innerError = error['InstructionError'];
    if (!Array.isArray(innerError) || innerError.length < 2) return undefined;
    const instructionError = innerError[1];
    if (typeof instructionError === 'object' && instructionError !== null && 'Custom' in instructionError) {
        return (instructionError as { Custom: number }).Custom;
    }
    return undefined;
}

function resolveIdlError(code: number, errors: BaseIdl['errors']) {
    return errors?.find(e => e.code === code);
}
