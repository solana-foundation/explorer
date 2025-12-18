import type { Connection, PublicKey, TransactionInstruction, VersionedMessage } from '@solana/web3.js';

import type { IdlInterpreter } from '../idl-interpreter.d';
import type { UnifiedAccounts, UnifiedArguments, UnifiedProgram, UnifiedWallet } from '../unified-program.d';

/**
 * Codama IDL interpreter (stub implementation)
 * Currently not supported, but properly identifies Codama IDLs to prevent infinite retries
 */
export class CodamaInterpreter implements IdlInterpreter<any, UnifiedProgram> {
    static readonly NAME = 'codama' as const;
    name = CodamaInterpreter.NAME;

    canHandle(idl: any): boolean {
        // Check for Codama IDL based on the standard field
        // This is the canonical way to identify Codama IDLs in the codebase
        return Boolean(idl) && typeof idl === 'object' && idl.standard === 'codama';
    }

    async createProgram(
        _connection: Connection,
        _wallet: UnifiedWallet,
        _programId: PublicKey | string,
        _idl: any
    ): Promise<UnifiedProgram> {
        throw new Error('Codama IDL format is not yet supported for interactive features.');
    }

    async createInstruction(
        _program: UnifiedProgram,
        _instructionName: string,
        _accounts: UnifiedAccounts,
        _args: UnifiedArguments
    ): Promise<TransactionInstruction | VersionedMessage> {
        throw new Error('Codama IDL format is not yet supported for interactive features.');
    }
}
