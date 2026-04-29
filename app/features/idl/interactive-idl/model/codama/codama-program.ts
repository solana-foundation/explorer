import type { ProgramClient } from '@codama/dynamic-client';
import type { TransactionInstruction } from '@solana/web3.js';
import { PublicKey, TransactionInstruction as TransactionInstructionClass } from '@solana/web3.js';

import { toBuffer } from '@/app/shared/lib/bytes';

import type { BaseIdl, UnifiedAccounts, UnifiedArguments, UnifiedProgram } from '../unified-program.d';
import { convertValue, getUserFacingArguments } from './convert-value';

/**
 * Structural types used instead of importing { AccountRole, Instruction } from
 * '@solana/kit' because the explorer uses @solana/kit 2.x while
 * @codama/dynamic-client depends on @solana/kit 6.x, making the
 * nominal types incompatible at the version boundary.
 *
 * Upgrading the explorer to @solana/kit 6.x would fix this but requires a
 * coordinated bump of @solana-program/system, @solana-program/token,
 * @solana-program/program-metadata (all currently peered to kit ^2.1.0) and
 * removing the pnpm override that pins @solana/addresses to 2.1.0.
 */
interface KitInstruction {
    programAddress: string;
    accounts?: ReadonlyArray<{ address: string; role: number }>;
    data?: Uint8Array;
}

// Values from @solana/kit AccountRole enum (v6.x):
// READONLY = 0, WRITABLE = 1, READONLY_SIGNER = 2, WRITABLE_SIGNER = 3
// See: https://github.com/anza-xyz/kit/blob/main/packages/instructions/src/roles.ts
const WRITABLE_SIGNER = 3;
const READONLY_SIGNER = 2;
const WRITABLE = 1;

/**
 * Convert a kit-style Instruction to a local TransactionInstruction.
 *
 * Creates TransactionInstruction instances using the explorer's own classes
 * so that `instanceof` checks in the execution layer work as expected.
 */
function toLocalTransactionInstruction(instruction: KitInstruction): TransactionInstruction {
    return new TransactionInstructionClass({
        data: instruction.data ? toBuffer(instruction.data) : undefined,
        keys: (instruction.accounts ?? []).map(account => ({
            isSigner: account.role === WRITABLE_SIGNER || account.role === READONLY_SIGNER,
            isWritable: account.role === WRITABLE_SIGNER || account.role === WRITABLE,
            pubkey: new PublicKey(account.address),
        })),
        programId: new PublicKey(instruction.programAddress),
    });
}

/**
 * Unified program implementation for Codama IDLs.
 * Wraps a ProgramClient from @codama/dynamic-client.
 */
export class CodamaUnifiedProgram implements UnifiedProgram {
    constructor(
        public programId: PublicKey,
        public idl: BaseIdl,
        private client: ProgramClient,
    ) {}

    getClient(): ProgramClient {
        return this.client;
    }

    async buildInstruction(
        instructionName: string,
        accounts: UnifiedAccounts,
        args: UnifiedArguments,
    ): Promise<TransactionInstruction> {
        const { root } = this.client;

        // Look up instruction node for type information
        const instructionNode = this.client.instructions.get(instructionName);
        if (!instructionNode) {
            throw new Error(
                `Instruction "${instructionName}" not found. Available: ${[...this.client.instructions.keys()].join(
                    ', ',
                )}`,
            );
        }

        // Convert positional args → named args using instruction argument definitions
        const userArgs = getUserFacingArguments(instructionNode);
        const namedArgs: Record<string, unknown> = {};

        for (let i = 0; i < userArgs.length; i++) {
            const argDef = userArgs[i];
            const rawValue = args[i];

            try {
                namedArgs[argDef.name] = convertValue(rawValue, argDef.type, root);
            } catch (e) {
                throw new Error(`Could not convert "${argDef.name}" argument for "${instructionName}"`, { cause: e });
            }
        }

        // Convert UnifiedAccounts (Record<string, PublicKey | null>) to string addresses
        const accountsInput: Record<string, string | null> = {};
        for (const [key, value] of Object.entries(accounts)) {
            accountsInput[key] = value ? value.toBase58() : null;
        }

        // Build the instruction
        const methodFn = this.client.methods[instructionName];
        if (!methodFn) {
            throw new Error(`Method "${instructionName}" not found on program client`);
        }

        const instruction = await methodFn(namedArgs).accounts(accountsInput).instruction();

        // Cast needed: dynamic-client uses @solana/kit 6.x types while
        // the explorer uses 2.x — the shape is identical at runtime.
        return toLocalTransactionInstruction(instruction as unknown as KitInstruction);
    }
}
