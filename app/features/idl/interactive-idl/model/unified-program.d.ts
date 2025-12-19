import type { PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';

/**
 * Base interface for all IDL types
 *
 * It targets legacy idls as well as 0.30+ versions
 */
export interface BaseIdl {
    accounts?: any[];
    constants?: any[];
    errors?: any[];
    events?: any[];
    instructions: any[];
    types?: any[];
    version?: string;
}

/**
 * Unified program interface for executing instructions
 */
export interface UnifiedProgram {
    programId: PublicKey;
    idl: BaseIdl;

    /**
     * Build a transaction instruction
     */
    buildInstruction(
        instructionName: string,
        accounts: UnifiedAccounts,
        args: UnifiedArguments
    ): Promise<TransactionInstruction>;
}

export type UnifiedAccounts = Record<string, PublicKey | null>;

export type UnifiedArguments = Array<unknown>;

/**
 * Unified wallet interface compatible with Anchor Wallet
 */
export interface UnifiedWallet {
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
    publicKey: PublicKey;
}
