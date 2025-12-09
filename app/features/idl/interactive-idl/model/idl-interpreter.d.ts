import type { Connection, PublicKey, TransactionInstruction, VersionedMessage } from '@solana/web3.js';

import type { BaseIdl, UnifiedAccounts, UnifiedArguments, UnifiedProgram, UnifiedWallet } from './unified-program.d';

export interface IdlInterpreter<TIdl extends BaseIdl = BaseIdl, TProgram extends UnifiedProgram = UnifiedProgram> {
    /**
     * Name of the interpreter (e.g., 'anchor', 'codama')
     */
    name: string;

    /**
     * Check if this interpreter can handle the given IDL
     */
    canHandle(idl: unknown): boolean;

    /**
     * Create a unified program from an IDL
     */
    createProgram(
        connection: Connection,
        wallet: UnifiedWallet,
        programId: PublicKey | string,
        idl: TIdl
    ): Promise<TProgram>;

    /**
     * Create instruction instance
     */
    createInstruction(
        program: TProgram,
        instructionName: string,
        accounts: Record<string, string> | UnifiedAccounts,
        args: UnifiedArguments
    ): Promise<TransactionInstruction | VersionedMessage>;
}
