// Token batch (discriminator 0xff) decodes in-package: the host app's fallback dispatcher does not
// handle it (the app routes batch at UI level), so relying on the fallback would drop batch to raw.
import { parseBatchInstruction, TOKEN_PROGRAM_ADDRESS, TokenInstruction } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import type { DecodedInstructionInfo, FallbackInstruction, FallbackInstructionAccount } from './types.js';
import { toKitInstruction } from './to-kit-instruction.js';

export const TOKEN_BATCH_DISCRIMINATOR = 0xff;

type TokenBatchSubInstruction = {
    type: string;
    accounts: Record<string, string>;
    data: Record<string, unknown>;
    extra_signers: FallbackInstructionAccount[];
};

function tokenBatchProgramLabel(programId: string): string | undefined {
    if (programId === TOKEN_PROGRAM_ADDRESS) {
        return 'spl-token';
    }
    if (programId === TOKEN_2022_PROGRAM_ADDRESS) {
        return 'spl-token-2022';
    }
    return undefined;
}

/**
 * Decodes an SPL Token / Token-2022 batch instruction into its sub-instructions. `undefined` means
 * "not a batch instruction" (cascade continues); malformed batch data throws.
 *
 * The SDK maps only named accounts per sub-instruction; multisig instructions carry extra co-signer
 * accounts beyond the named ones, recovered from the raw slices via the batch `numberOfAccounts` field.
 */
export function decodeTokenBatchInstruction(instruction: FallbackInstruction): DecodedInstructionInfo | undefined {
    const program = tokenBatchProgramLabel(instruction.programId);
    if (program === undefined) {
        return undefined;
    }

    const kitInstruction = toKitInstruction(instruction);
    if (kitInstruction.data.length < 1 || kitInstruction.data[0] !== TOKEN_BATCH_DISCRIMINATOR) {
        return undefined;
    }

    const parsed = parseBatchInstruction(kitInstruction);

    const accountOffsets = parsed.data.data.reduce<number[]>(
        (offsets, entry, i) => [...offsets, offsets[i] + entry.numberOfAccounts],
        [0],
    );

    const instructions = parsed.instructions.map<TokenBatchSubInstruction>((sub, i) => {
        // Every variant carries plain named account metas except a (protocol-invalid) nested batch.
        const namedAccounts: Record<string, { address: string }> = 'accounts' in sub ? sub.accounts : {};
        const accounts = Object.fromEntries(Object.entries(namedAccounts).map(([name, meta]) => [name, meta.address]));
        const subData: Record<string, unknown> = sub.data;
        const namedCount = Object.keys(accounts).length;
        return {
            accounts,
            data: subData,
            extra_signers: instruction.accounts.slice(accountOffsets[i] + namedCount, accountOffsets[i + 1]),
            type: TokenInstruction[sub.instructionType],
        };
    });

    return { info: { instructions }, program, type: 'batch' };
}
