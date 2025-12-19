import { AnchorProvider, type Idl as AnchorIdl, Program as AnchorProgram, type Wallet } from '@coral-xyz/anchor';
import type { IdlInstruction } from '@coral-xyz/anchor/dist/esm/idl';
import { formatSerdeIdl, getFormattedIdl } from '@entities/idl';
import { type Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

import type { IdlInterpreter } from '../idl-interpreter.d';
import { AnchorUnifiedProgram } from './anchor-program';
import { parseArrayInput } from './array-parser';

/**
 * Anchor IDL interpreter
 */
export class AnchorInterpreter implements IdlInterpreter<AnchorIdl, AnchorUnifiedProgram> {
    static readonly NAME = 'anchor' as const;
    name = AnchorInterpreter.NAME;

    canHandle(idl: any): boolean {
        // Check for Anchor-specific fields
        if (!idl || typeof idl !== 'object') {
            return false;
        }

        const isString = (value: unknown): value is string => typeof value === 'string';

        // Modern Anchor IDL (>= 0.30.0): has address at root, metadata (version or spec), and instructions
        return (
            isString(idl.address) &&
            (isString(idl.metadata?.version) || isString(idl.metadata?.spec)) &&
            Array.isArray(idl.instructions)
        );
    }

    async createProgram(
        connection: Connection,
        wallet: Wallet,
        programId: PublicKey | string,
        idl: AnchorIdl
    ): Promise<AnchorUnifiedProgram> {
        const publicKey = typeof programId === 'string' ? new PublicKey(programId) : programId;

        // Create provider
        const provider = new AnchorProvider(connection, wallet);

        const pubkey = publicKey.toBase58();

        const properIdl = getFormattedIdl(formatSerdeIdl, idl, pubkey);

        // Create Anchor program
        let anchorProgram: AnchorProgram;
        try {
            anchorProgram = new AnchorProgram(properIdl, provider);
        } catch (error) {
            throw new Error(
                `Failed to create Anchor program: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        return new AnchorUnifiedProgram(publicKey, idl, anchorProgram);
    }

    async createInstruction<T extends AnchorUnifiedProgram>(
        program: T,
        instructionName: Parameters<typeof program.buildInstruction>[0],
        accounts: Record<string, string>,
        args: Parameters<typeof program.buildInstruction>[2]
    ) {
        // Find instruction definition in IDL
        const ixDef = this.findInstructionTypeDefs(program, instructionName);

        // Convert arguments based on IDL type definitions
        const convertedArguments = this.convertArguments(instructionName, ixDef.args, args);

        // Convert accounts from strings to PublicKey objects
        const convertedAccounts = this.convertAccounts(instructionName, ixDef.accounts, accounts);

        return program.buildInstruction(instructionName, convertedAccounts, convertedArguments);
    }

    private findInstructionTypeDefs<T extends AnchorUnifiedProgram>(unifiedProgram: T, instructionName: string) {
        // Find instruction definition in IDL
        const ixDef = unifiedProgram.getIdl().instructions.find((ix: any) => ix.name === instructionName);
        if (!ixDef) {
            throw new Error(`Instruction definition not found for "${instructionName}"`);
        }
        return ixDef;
    }

    /**
     * Convert string argument to proper type based on IDL type definition
     */
    private convertArgument(value: any, type: any): any {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        // Handle primitive types
        if (typeof type === 'string') {
            switch (type) {
                case 'u8':
                case 'u16':
                case 'u32':
                case 'u64':
                case 'u128':
                case 'i8':
                case 'i16':
                case 'i32':
                case 'i64':
                case 'i128':
                    return new BN(value);
                case 'bool':
                    return value === 'true' || value === true;
                case 'string':
                    return String(value);
                case 'bytes':
                    return Buffer.from(value);
                case 'pubkey':
                case 'publicKey':
                    return new PublicKey(value);
                default:
                    return value;
            }
        }

        // Handle complex types
        if (typeof type === 'object') {
            if ('vec' in type) {
                // Parse JSON array or comma-separated values
                const arr = parseArrayInput(value);
                return arr.map((item: any) => this.convertArgument(item, type.vec));
            }
            if ('option' in type) {
                return value === '' || value === null ? null : this.convertArgument(value, type.option);
            }
            if ('array' in type) {
                const arr = parseArrayInput(value);
                return arr.map((item: any) => this.convertArgument(item, type.array[0]));
            }
            if ('defined' in type) {
                // For defined types, use Buffer
                return Buffer.from(value);
            }
        }

        return value;
    }

    /**
     * Convert arguments to proper type
     */
    private convertArguments(
        instructionName: string,
        argumentsMeta: Readonly<Required<IdlInstruction['args']>>,
        args: any[]
    ) {
        const convertedArguments = args.map((arg, index) => {
            const argDef = argumentsMeta[index];
            if (!argDef) {
                throw new Error(`Argument at index ${index} not found in instruction definition`);
            }
            try {
                return this.convertArgument(arg, argDef.type);
            } catch {
                throw new Error(`Could not convert "${argDef.name}" argument for "${instructionName}"`);
            }
        });

        return convertedArguments;
    }

    /**
     * Convert account strings to PublicKey objects
     */
    private convertAccounts(
        instructionName: string,
        accountsMeta: Readonly<Required<IdlInstruction['accounts']>>,
        accounts: Record<string, string>
    ): Record<string, PublicKey | null> {
        const converted: ReturnType<typeof this.convertAccounts> = {};

        function findAccountMeta(name: string, metas = accountsMeta) {
            const accountIndex = metas.findIndex(meta => meta.name === name);
            if (accountIndex !== -1) {
                const accountMeta = metas[accountIndex];

                if ('accounts' in accountMeta) {
                    // current limitation: we do not parse nested accounts
                    return undefined;
                } else {
                    return accountMeta;
                }
            }

            return undefined;
        }

        for (const [key, value] of Object.entries(accounts)) {
            const accountMeta = findAccountMeta(key);

            if (!accountMeta) {
                throw new Error(`Account with key ${key} not found in instruction definition`);
            }

            try {
                if (!value || value === '') {
                    if (accountMeta?.optional) converted[key] = null;
                } else if (typeof value === 'string') {
                    if (value.trim() !== '') {
                        converted[key] = new PublicKey(value);
                    } else {
                        if (accountMeta?.optional) converted[key] = null;
                    }
                }
            } catch {
                throw new Error(`Could not convert "${accountMeta.name}" argument for "${instructionName}"`);
            }
        }

        return converted;
    }
}
