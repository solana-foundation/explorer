import type { Connection, PublicKey } from '@solana/web3.js';

import { AnchorInterpreter } from './anchor/anchor-interpreter';
import { CodamaInterpreter } from './codama/codama-interpreter';
import type { IdlExecutorConfig, IdlExecutorSpec } from './idl-executor.d';
import type { IdlInterpreter } from './idl-interpreter.d';
import type { BaseIdl, UnifiedAccounts, UnifiedArguments, UnifiedProgram, UnifiedWallet } from './unified-program.d';

export class IdlExecutor implements IdlExecutorSpec {
    private interpreters: Map<string, IdlInterpreter>;
    private connection: Connection;

    constructor(config: IdlExecutorConfig) {
        this.connection = config.connection;
        this.interpreters = new Map();

        // Register default interpreters
        // Order matters: Codama is checked first since it has a specific standard field
        const defaultInterpreters = config.interpreters || [
            new CodamaInterpreter(),
            new AnchorInterpreter(),
            // add future default interpreters here
        ];

        for (const interpreter of defaultInterpreters) {
            this.registerInterpreter(interpreter as IdlInterpreter<BaseIdl>);
        }
    }

    /**
     * Register a new interpreter
     */
    registerInterpreter(interpreter: IdlInterpreter): void {
        this.interpreters.set(interpreter.name, interpreter);
    }

    /**
     * Get a registered interpreter by name
     */
    getInterpreter(name: string): IdlInterpreter | undefined {
        return this.interpreters.get(name);
    }

    /**
     * Automatically detect and use the appropriate interpreter for an IDL
     */
    detectInterpreter(idl: unknown): IdlInterpreter | null {
        for (const interpreter of this.interpreters.values()) {
            if (interpreter.canHandle(idl)) {
                return interpreter;
            }
        }
        return null;
    }

    protected selectInterpreter(idl: unknown, interpreterName?: string) {
        let interpreter: IdlInterpreter | null;

        if (interpreterName) {
            interpreter = this.interpreters.get(interpreterName) || null;
            if (!interpreter) {
                throw new Error(`Interpreter "${interpreterName}" not found`);
            }
        } else {
            interpreter = this.detectInterpreter(idl);
            if (!interpreter) {
                throw new Error('No suitable interpreter found for the provided IDL');
            }
        }

        return interpreter;
    }

    /**
     * Initialize a unified program from an IDL using a specific interpreter
     */
    async initializeProgram<T extends BaseIdl = BaseIdl>(
        idl: T,
        programId: PublicKey | string,
        wallet?: UnifiedWallet,
        interpreterName?: string
    ) {
        const interpreter = this.selectInterpreter(idl, interpreterName);

        if (!wallet) throw new Error('Wallet is not provided');

        const program = await interpreter.createProgram(this.connection, wallet, programId, idl);

        return program;
    }

    /**
     * Get instruction instance
     */
    async getInstruction<T extends BaseIdl = BaseIdl>(
        program: UnifiedProgram,
        instructionName: string,
        accs: Record<string, string> | UnifiedAccounts,
        args: UnifiedArguments,
        idl: T,
        interpreterName: string
    ) {
        const interpreter = this.selectInterpreter(idl, interpreterName);
        const instructionArguments = normalizeArguments(args, interpreterName);
        const instruction = await interpreter.createInstruction(program, instructionName, accs, instructionArguments);

        return instruction;
    }

    /**
     * Update connection
     */
    setConnection(connection: Connection): void {
        this.connection = connection;
    }
}

/**
 * Populates accounts into format that satisfies the UnifiedAccounts
 */
export function populateAccounts(
    accounts: Record<string, string>,
    instructionName: string
): Record<string, string> | UnifiedAccounts {
    return Object.keys(accounts).reduce((acc, k) => {
        const { field, value } = populateValue(accounts, k, instructionName);
        acc[field] = String(value);
        return acc;
    }, {} as Record<string, string>);
}

/**
 * Populate arguments into format that satisfies the UnifiedArguments
 */
export function populateArguments(args: Record<string, string>, instructionName: string) {
    return Object.keys(args).reduce((acc, k) => {
        const { value } = populateValue(args, k, instructionName);
        acc.push(value);
        return acc;
    }, [] as UnifiedArguments);
}

/**
 * Extract "key:value" for from the "name.key:value" by provided name
 */
function populateValue(data: Record<string, unknown>, key: string, instructionName: string) {
    const [name, field] = key.split('.');
    if (name !== instructionName) throw new Error(`Could not populate data for ${instructionName}`);

    return { field, value: data[key] };
}

/**
 * Perform basic normalization for arguments.
 * Needed to address complex leaf types
 * In-depth transformations should be done on the interpreter level
 */
function normalizeArguments(args: UnifiedArguments, _interpreterName: string) {
    return args;
}
