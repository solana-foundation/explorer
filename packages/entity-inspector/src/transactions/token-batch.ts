// Token batch (discriminator 0xff) decodes in-package: the host app's fallback dispatcher does not
// handle it (the app routes batch at UI level), so relying on the fallback would drop batch to raw.
// The decode core (offset math, co-signer recovery) is shared via @explorer/parsers.
import {
    hasTokenBatchDiscriminator,
    parseTokenBatchInstruction,
    TOKEN_BATCH_DISCRIMINATOR,
    tokenBatchProgramLabel,
} from '@explorer/parsers/token-batch';
import { isSignerRole, isWritableRole } from '@solana/kit';
import { TokenInstruction } from '@solana-program/token';

import type { DecodedInstructionInfo, FallbackInstruction, FallbackInstructionAccount } from './types.js';
import { toKitInstruction } from './to-kit-instruction.js';

export { TOKEN_BATCH_DISCRIMINATOR };

type TokenBatchSubInstruction = {
    type: string;
    accounts: Record<string, string>;
    data: Record<string, unknown>;
    extra_signers: FallbackInstructionAccount[];
};

/**
 * Decodes an SPL Token / Token-2022 batch instruction into its sub-instructions. `undefined` means
 * "not a batch instruction" (cascade continues); malformed batch data throws.
 */
export function decodeTokenBatchInstruction(instruction: FallbackInstruction): DecodedInstructionInfo | undefined {
    const program = tokenBatchProgramLabel(instruction.programId);
    if (program === undefined) {
        return undefined;
    }

    const kitInstruction = toKitInstruction(instruction);
    if (!hasTokenBatchDiscriminator(kitInstruction.data)) {
        return undefined;
    }

    const instructions = parseTokenBatchInstruction(kitInstruction).map<TokenBatchSubInstruction>(
        ({ extraAccounts, parsed }) => {
            // Every variant carries plain named account metas except a (protocol-invalid) nested batch.
            const namedAccounts: Record<string, { address: string }> = 'accounts' in parsed ? parsed.accounts : {};
            const accounts = Object.fromEntries(
                Object.entries(namedAccounts).map(([name, meta]) => [name, meta.address]),
            );
            const subData: Record<string, unknown> = parsed.data;
            return {
                accounts,
                data: subData,
                extra_signers: extraAccounts.map(meta => ({
                    address: meta.address,
                    signer: isSignerRole(meta.role),
                    writable: isWritableRole(meta.role),
                })),
                type: TokenInstruction[parsed.instructionType],
            };
        },
    );

    return { info: { instructions }, program, type: 'batch' };
}
