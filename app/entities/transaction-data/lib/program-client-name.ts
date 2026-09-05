import { identifyStakeInstruction, STAKE_PROGRAM_ADDRESS, StakeInstruction } from '@solana-program/stake';
import { identifySystemInstruction, SYSTEM_PROGRAM_ADDRESS, SystemInstruction } from '@solana-program/system';
import {
    ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    AssociatedTokenInstruction,
    CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR,
    identifyAssociatedTokenInstruction,
    identifyTokenInstruction,
    TOKEN_PROGRAM_ADDRESS,
    TokenInstruction,
} from '@solana-program/token';
import {
    identifyToken2022Instruction,
    TOKEN_2022_PROGRAM_ADDRESS,
    Token2022Instruction,
} from '@solana-program/token-2022';
import { camelToTitleCase } from '@utils/index';

import { bytes } from '@/app/shared/lib/bytes';

import { identifyInstruction } from './identify-instruction';
import type { InstructionNameLookup } from './types';

// A numeric enum compiles to an object carrying the reverse mapping (12 -> 'TransferChecked'), which is
// where the name comes from. Values are optional because the reverse mapping has no entry for an index
// outside the enum — which a client that gains instructions faster than we bump it can produce.
type InstructionEnum = Record<number, string | undefined>;

type ProgramClient = {
    identify: (data: Uint8Array) => number;
    names: InstructionEnum;
    /**
     * Generated-client enum names whose RPC `parsed.type` differs, keyed by the enum name. Without these
     * the same instruction reads differently depending on whether it was simulated or fetched — see
     * `rpcInstructionType`.
     */
    rpcTypeOverrides?: Record<string, string>;
    /** Restores a discriminator the client cannot read from the wire data as sent. */
    normalizeData?: (data: Uint8Array) => Uint8Array;
};

/**
 * Programs whose instruction names come from their generated `@solana-program/*` client: a
 * discriminator lookup, never a decode of the arguments or accounts.
 *
 * These are the programs the RPC normally pre-parses, so on a fetched transaction the name already
 * comes from `parsed.type`. This resolver covers the case where no RPC parse exists — a simulated
 * message — and reproduces that same wording via `rpcTypeOverrides`.
 */
const PROGRAM_CLIENTS: Partial<Record<string, ProgramClient>> = {
    [ASSOCIATED_TOKEN_PROGRAM_ADDRESS]: {
        identify: identifyAssociatedTokenInstruction,
        names: AssociatedTokenInstruction,
        // Many clients send the legacy Create instruction with no data at all. The instruction card
        // reconstructs the discriminator the same way — see decode-instruction-associated-token.
        normalizeData: data => (data.length === 0 ? bytes([CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR]) : data),
        rpcTypeOverrides: {
            CreateAssociatedToken: 'create',
            CreateAssociatedTokenIdempotent: 'createIdempotent',
            RecoverNestedAssociatedToken: 'recoverNested',
        },
    },
    [STAKE_PROGRAM_ADDRESS]: {
        identify: identifyStakeInstruction,
        names: StakeInstruction,
        rpcTypeOverrides: { DelegateStake: 'delegate' },
    },
    [SYSTEM_PROGRAM_ADDRESS]: {
        identify: identifySystemInstruction,
        names: SystemInstruction,
        rpcTypeOverrides: {
            AdvanceNonceAccount: 'advanceNonce',
            AuthorizeNonceAccount: 'authorizeNonce',
            InitializeNonceAccount: 'initializeNonce',
            TransferSol: 'transfer',
            TransferSolWithSeed: 'transferWithSeed',
            UpgradeNonceAccount: 'upgradeNonce',
            WithdrawNonceAccount: 'withdrawNonce',
        },
    },
    // Token and Token-2022 enum names match the RPC's `parsed.type` for every instruction we have
    // checked, so neither carries overrides. Token-2022's extension groups are unverified against the
    // RPC — see the extension cases in program-client-name.spec.
    [TOKEN_2022_PROGRAM_ADDRESS]: { identify: identifyToken2022Instruction, names: Token2022Instruction },
    [TOKEN_PROGRAM_ADDRESS]: { identify: identifyTokenInstruction, names: TokenInstruction },
};

/**
 * The instruction name from the program's generated client, or undefined for any other program and for
 * an unrecognized discriminator. Worded as the RPC words it, so a simulated instruction reads the same
 * as the same instruction on a fetched transaction.
 * @param lookup - The program, which selects the client, and the leading instruction bytes
 */
export function resolveProgramClientInstructionName(lookup: InstructionNameLookup): string | undefined {
    const client = PROGRAM_CLIENTS[lookup.programId];
    if (!client) return undefined;

    // Token-2022 reads a second byte to tell its extension instructions apart, so an extension resolves
    // to its own name rather than to the name of the leading byte's group.
    const index = identifyInstruction(client.identify, normalize(client, lookup));
    if (index === undefined) return undefined;

    const name = client.names[index];
    if (name === undefined) return undefined;

    return camelToTitleCase(rpcInstructionType(client, name));
}

function normalize(client: ProgramClient, lookup: InstructionNameLookup): InstructionNameLookup {
    if (!client.normalizeData) return lookup;
    return { ...lookup, data: client.normalizeData(lookup.data) };
}

/**
 * The RPC's `parsed.type` for a generated-client enum name. The two agree for most instructions; where
 * they do not, the RPC spelling wins so both paths word the instruction identically.
 */
function rpcInstructionType(client: ProgramClient, enumName: string): string {
    const override = client.rpcTypeOverrides?.[enumName];
    if (override !== undefined) return override;

    // The enum names are PascalCase and `parsed.type` is camelCase. camelToTitleCase inserts a space
    // before every capital, so lowercasing the first character avoids a leading space.
    return enumName.charAt(0).toLowerCase() + enumName.slice(1);
}
