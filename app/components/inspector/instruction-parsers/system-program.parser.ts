import { CreateAccountWithSeedInfo } from '@components/instruction/system/types';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getCreateAccountWithSeedInstructionDataDecoder,
    identifySystemInstruction,
    SystemInstruction,
} from '@solana-program/system';

/**
 * Helper function to safely convert BigInt or number to regular number
 */
function safeNumber(value: bigint | number): number {
    if (typeof value === 'bigint') {
        return Number(value);
    }
    return value;
}

/**
 * Parsed result structure matching the library's parser format.
 * Contains both accounts and data sections.
 */
interface ParsedCreateAccountWithSeed {
    programAddress: string;
    accounts: {
        payer: { address: string };
        newAccount: { address: string };
        baseAccount: { address: string };
    };
    data: {
        base: string;
        seed: string;
        amount: bigint;
        space: bigint;
        programAddress: string;
    };
}

/**
 * Parse CreateAccountWithSeed instruction handling both 2 and 3 account variants.
 *
 * The CreateAccountWithSeed instruction can have either:
 * - 2 accounts: when payer === baseAccount (baseAccount is omitted from accounts array)
 * - 3 accounts: when payer !== baseAccount (baseAccount is included)
 *
 * Returns the same structure as the @solana-program/system library parser,
 * but handles both cases by extracting the base address from instruction data.
 */
function parseCreateAccountWithSeedInstructionSafe(instruction: TransactionInstruction): ParsedCreateAccountWithSeed {
    const decodedData = getCreateAccountWithSeedInstructionDataDecoder().decode(instruction.data);

    // Base address is always in the instruction data
    const baseAddress = decodedData.base as string;

    // Determine baseAccount: use keys[2] if present, otherwise derive from data
    const baseAccountAddress = instruction.keys.length >= 3 ? instruction.keys[2].pubkey.toBase58() : baseAddress;

    return {
        accounts: {
            baseAccount: { address: baseAccountAddress },
            newAccount: { address: instruction.keys[1].pubkey.toBase58() },
            payer: { address: instruction.keys[0].pubkey.toBase58() },
        },
        data: {
            amount: decodedData.amount,
            base: baseAddress,
            programAddress: decodedData.programAddress as string,
            seed: decodedData.seed,
            space: decodedData.space,
        },
        programAddress: instruction.programId.toBase58(),
    };
}

/**
 * Convert parsed CreateAccountWithSeed data to the RPC format.
 * Matches the pattern used by other converters in into-parsed-data.ts.
 */
function convertCreateAccountWithSeedInfo(parsed: ParsedCreateAccountWithSeed): CreateAccountWithSeedInfo {
    return {
        base: new PublicKey(parsed.data.base),
        lamports: safeNumber(parsed.data.amount),
        newAccount: new PublicKey(parsed.accounts.newAccount.address),
        owner: new PublicKey(parsed.data.programAddress),
        seed: parsed.data.seed,
        source: new PublicKey(parsed.accounts.payer.address),
        space: safeNumber(parsed.data.space),
    };
}

/**
 * Parse System Program instruction and return parsed data in RPC format.
 * Currently only handles CreateAccountWithSeed instruction.
 */
export function parseSystemProgramInstruction(
    instruction: TransactionInstruction
): { type: string; info: CreateAccountWithSeedInfo } | null {
    const { data } = instruction;

    try {
        const instructionType = identifySystemInstruction(data);

        switch (instructionType) {
            case SystemInstruction.CreateAccountWithSeed: {
                const parsed = parseCreateAccountWithSeedInstructionSafe(instruction);
                return {
                    info: convertCreateAccountWithSeedInfo(parsed),
                    type: 'createAccountWithSeed',
                };
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
}
