import type { Idl as AnchorIdl, Program as AnchorProgram } from '@coral-xyz/anchor';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';

import type { UnifiedAccounts, UnifiedArguments, UnifiedProgram } from '../unified-program.d';

/**
 * Unified program implementation for Anchor
 */
export class AnchorUnifiedProgram implements UnifiedProgram {
    constructor(public programId: PublicKey, public idl: AnchorIdl, private program: AnchorProgram) {}

    // Build the instruction using Anchor's methods
    async _buildInstruction(
        instructionName: string,
        accounts: UnifiedAccounts,
        args: UnifiedArguments
    ): Promise<TransactionInstruction> {
        try {
            const instruction = this.program.methods[instructionName];

            return instruction(...args)
                .accounts(accounts as Record<string, PublicKey>) // keep null for optional accounts as opposit breaks account resolution
                .instruction();
        } catch (error) {
            throw new Error(
                `Failed to build instruction "${instructionName}": ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    async buildInstruction(
        instructionName: string,
        ixAccounts: UnifiedAccounts,
        ixArguments: Array<any> // define a type that satisfies Anchor's arguments type
    ): Promise<TransactionInstruction> {
        if (!(instructionName in this.program.methods)) {
            throw new Error(
                `Instruction "${instructionName}" not found. Available: ${Object.keys(this.program.methods).join(', ')}`
            );
        }

        return this._buildInstruction(instructionName, ixAccounts, ixArguments);
    }

    /**
     * Allow to access the Idl that have standartized naming for methods
     */
    getIdl() {
        return this.program.idl;
    }
}
