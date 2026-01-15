import type {
    IdlInstructionAccount,
    IdlPda,
    IdlSeed,
    IdlSeedAccount,
    IdlSeedArg,
    IdlSeedConst,
} from '@coral-xyz/anchor/dist/cjs/idl';
import type { SupportedIdl } from '@entities/idl';
import type { PublicKey } from '@solana/web3.js';

export type { IdlSeed, IdlSeedAccount, IdlSeedArg, IdlSeedConst };

export type PdaDefinition = IdlPda;
export type PdaAccount = Pick<IdlInstructionAccount, 'name' | 'pda'>;

/**
 * Unified argument representation
 */
export interface PdaArgument {
    name: string;
    type: string;
}

/**
 * Unified instruction representation for PDA generation
 */
export interface PdaInstruction {
    name: string;
    accounts: PdaAccount[];
    args: PdaArgument[];
}

/**
 * Provider for extracting PDA information from different IDL formats
 */
export type PdaProvider = {
    /**
     * Unique name identifier for this provider
     */
    name: 'anchor';

    /**
     * Check if this provider can handle the given IDL
     */
    canHandle: (idl: SupportedIdl) => boolean;

    /**
     * Extract program ID from IDL
     */
    getProgramId: (idl: SupportedIdl) => PublicKey | null;

    /**
     * Find instruction by name in the IDL
     * Returns null if instruction not found
     */
    findInstruction: (idl: SupportedIdl, instructionName: string) => PdaInstruction | null;
};
