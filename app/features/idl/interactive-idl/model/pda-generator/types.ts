import type { SupportedIdl } from '@entities/idl';
import type { PublicKey } from '@solana/web3.js';

/**
 * Unified PDA seed representation
 */
export interface PdaSeed {
    kind: 'const' | 'arg' | 'account';
    path?: string; // For 'arg' and 'account' seeds
    value?: number[]; // For 'const' seeds
}

/**
 * Unified PDA account representation
 */
export interface PdaAccount {
    name: string;
    pda?: {
        seeds: PdaSeed[];
    };
}

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
