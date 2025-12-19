import type { Connection, PublicKey, TransactionInstruction, VersionedMessage } from '@solana/web3.js';

import type { IdlInterpreter } from './idl-interpreter.d';
import type { BaseIdl, UnifiedAccounts, UnifiedArguments, UnifiedProgram, UnifiedWallet } from './unified-program.d';

/**
 * Configuration for the IDL executor
 */
export interface IdlExecutorConfig {
    connection: Connection;
    interpreters?: IdlInterpreter[];
}

interface IdlExecutorSpec {
    initializeProgram<T extends BaseIdl>(
        idl: T,
        programId: PublicKey,
        wallet?: UnifiedWallet,
        interpreterName?: string
    ): Promise<UnifiedProgram>;

    getInstruction<T extends BaseIdl>(
        program: UnifiedProgram,
        instructionName: string,
        accs: Record<string, string> | UnifiedAccounts,
        args: UnifiedArguments,
        idl: T,
        interpreterName: string
    ): Promise<TransactionInstruction | VersionedMessage>;

    setConnection(connection: Connection): void;
}
