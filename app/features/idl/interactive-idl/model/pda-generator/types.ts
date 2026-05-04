import type {
    IdlInstructionAccount,
    IdlPda,
    IdlSeed,
    IdlSeedAccount,
    IdlSeedArg,
    IdlSeedConst,
    IdlType,
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
    type: IdlType;
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
 * Result of PDA generation for a single account
 */
export interface PdaGenerationResult {
    generated: string | null;
    seeds: { value: string | null; name: string }[];
}

export type PdaFormArgs = Record<string, string | undefined>;
export type PdaFormAccounts = Record<string, string | Record<string, string | undefined> | undefined>;

/**
 * Provider for extracting PDA information from different IDL formats
 */
export type PdaProvider = {
    /**
     * Unique name identifier for this provider
     */
    name: 'anchor' | 'codama';

    /**
     * Check if this provider can handle the given IDL
     */
    canHandle: (idl: SupportedIdl) => boolean;

    /**
     * Extract program ID from IDL
     */
    getProgramId: (idl: SupportedIdl) => PublicKey | null;

    /**
     * Compute PDA addresses for an instruction's accounts.
     */
    computePdas: (
        idl: SupportedIdl,
        instructionName: string,
        args: PdaFormArgs,
        accounts: PdaFormAccounts,
    ) => Promise<Record<string, PdaGenerationResult>>;
};
