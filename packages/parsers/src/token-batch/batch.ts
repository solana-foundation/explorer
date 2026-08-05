// SPL Token / Token-2022 batch (discriminator 0xff) decode core. The SDK names only each
// sub-instruction's declared accounts; multisig sub-instructions carry extra co-signer accounts
// beyond the named ones, recovered here from the raw slices via the batch `numberOfAccounts` field.
import type { AccountMeta } from '@solana/kit';
import { parseBatchInstruction, type ParsedTokenInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import type { KitInstruction } from '../kit-instruction.js';
import { SPL_TOKEN_2022_PROGRAM_LABEL, SPL_TOKEN_PROGRAM_LABEL, type TokenProgram } from '../program-registry.js';

// `TokenInstruction::Batch = 255` per https://github.com/solana-program/token/blob/cd5cdc8d35a854c3dde4b673fabd7570b20aab0d/pinocchio/program/tests/batch.rs#L31
export const TOKEN_BATCH_DISCRIMINATOR = 0xff;

export function hasTokenBatchDiscriminator(data: { length: number; 0?: number }): boolean {
    return data.length >= 1 && data[0] === TOKEN_BATCH_DISCRIMINATOR;
}

export function tokenBatchProgramLabel(programAddress: string): TokenProgram | undefined {
    if (programAddress === TOKEN_PROGRAM_ADDRESS) {
        return SPL_TOKEN_PROGRAM_LABEL;
    }
    if (programAddress === TOKEN_2022_PROGRAM_ADDRESS) {
        return SPL_TOKEN_2022_PROGRAM_LABEL;
    }
    return undefined;
}

/** Structural on purpose — fits kit instructions and any adapted shape carrying the same fields. */
export function isTokenBatchInstruction(instruction: {
    programAddress: string;
    data: { length: number; 0?: number };
}): boolean {
    return (
        tokenBatchProgramLabel(instruction.programAddress) !== undefined && hasTokenBatchDiscriminator(instruction.data)
    );
}

export type TokenBatchSubInstruction = {
    parsed: ParsedTokenInstruction<string>;
    /** Account metas beyond the SDK-named ones for this sub-instruction — multisig co-signers on-chain. */
    extraAccounts: readonly AccountMeta<string>[];
};

/** Caller guarantees batch data (check `hasTokenBatchDiscriminator` first); malformed data throws. */
export function parseTokenBatchInstruction(instruction: KitInstruction): TokenBatchSubInstruction[] {
    const parsed = parseBatchInstruction(instruction);

    const accountOffsets = parsed.data.data.reduce<number[]>(
        (offsets, entry, i) => [...offsets, offsets[i] + entry.numberOfAccounts],
        [0],
    );

    return parsed.instructions.map((sub, i) => {
        // Every variant carries plain named account metas except a (protocol-invalid) nested batch.
        const namedCount = 'accounts' in sub ? Object.keys(sub.accounts).length : 0;
        return {
            extraAccounts: instruction.accounts.slice(accountOffsets[i] + namedCount, accountOffsets[i + 1]),
            parsed: sub,
        };
    });
}
