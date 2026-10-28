import { BorshEventCoder, BorshInstructionCoder, Idl, Program } from '@coral-xyz/anchor';
import { IdlDefinedFields } from '@coral-xyz/anchor/dist/cjs/idl';
import { IdlField, IdlInstruction, IdlType, IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { getAnchorIdls, useAnchorProgram } from '@entities/idl';
import type { InstructionArg } from '@entities/instruction-card';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { camelToTitleCase, numberWithSeparator, snakeToTitleCase } from '@utils/index';

import { equals, fromBase64, fromHex, toBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';

const ANCHOR_SELF_CPI_TAG = fromHex('1d9acb512ea545e4').reverse();
const ANCHOR_SELF_CPI_NAME = 'Anchor Self Invocation';

export function instructionIsSelfCPI(ixData: Uint8Array): boolean {
    const slice = ixData.subarray(0, 8);
    return equals(slice, ANCHOR_SELF_CPI_TAG);
}

/**
 * Decodes an Anchor event with support for custom discriminators.
 * Similar to instruction decoding but handles the self-CPI event format.
 */
export function decodeEventWithCustomDiscriminator(eventData: string, program: Program): any | null {
    if (!program.idl.events || program.idl.events.length === 0) {
        return null;
    }

    // Event data is base64 encoded
    const data = fromBase64(eventData);

    // Find matching event by comparing discriminators
    for (const event of program.idl.events) {
        const discriminator = event.discriminator;
        const discLength = discriminator.length;

        // Check if event data is long enough
        if (data.length < discLength) {
            continue;
        }

        // Compare discriminator bytes
        const matches = discriminator.every((byte, index) => data[index] === byte);

        if (matches) {
            // Found matching event
            if (discLength < 8) {
                // For custom short discriminators, pad them for the BorshEventCoder
                const paddingBytes = new Array(8 - discLength).fill(0);
                const paddedDiscriminator = [...discriminator, ...paddingBytes];

                // Create modified IDL with padded discriminator
                const modifiedIdl: Idl = {
                    ...program.idl,
                    events: program.idl.events.map(ev =>
                        ev.name === event.name ? { ...ev, discriminator: paddedDiscriminator } : { ...ev },
                    ),
                };

                // Pad the event data
                const eventArgs = data.subarray(discLength);
                const paddedData = new Uint8Array(paddedDiscriminator.length + eventArgs.length);
                paddedData.set(paddedDiscriminator, 0);
                paddedData.set(eventArgs, paddedDiscriminator.length);

                try {
                    const coder = new BorshEventCoder(modifiedIdl);
                    const decoded = coder.decode(toBase64(paddedData));
                    return decoded;
                } catch (_error) {
                    return { data: {}, name: event.name };
                }
            } else {
                // Standard 8-byte discriminator - use normal decoder
                try {
                    const coder = new BorshEventCoder(program.idl);
                    const decoded = coder.decode(eventData);
                    return decoded;
                } catch (_error) {
                    return { data: {}, name: event.name };
                }
            }
        }
    }

    return null;
}

/**
 * Decodes an event from a log message's base64 data.
 * Returns the decoded event with its name and fields, or null if decoding fails.
 */
export function decodeEventFromLog(eventData: string, program: Program): { name: string; data: any } | null {
    return decodeEventWithCustomDiscriminator(eventData, program);
}

export function getAnchorProgramName(program: Program | null): string | undefined {
    return program && 'name' in program.idl.metadata ? snakeToTitleCase(program.idl.metadata.name) : undefined;
}

export function AnchorProgramName({
    programId,
    url,
    defaultName = 'Unknown Program',
    cluster,
}: {
    programId: PublicKey;
    url: string;
    defaultName?: string;
    cluster?: Cluster;
}) {
    const { program } = useAnchorProgram({
        cluster: cluster ?? Cluster.MainnetBeta,
        programAddress: programId.toString(),
        select: getAnchorIdls,
        url,
    });
    const programName = getAnchorProgramName(program) || defaultName;
    return <>{programName}</>;
}

/**
 * Decodes an instruction using a custom discriminator matcher that supports variable-length discriminators.
 * Handles both standard 8-byte Anchor discriminators and custom shorter discriminators.
 */
export function decodeInstructionWithCustomDiscriminator(ixData: Uint8Array, program: Program): any | null {
    const data = ixData;

    // Find matching instruction by comparing discriminators
    for (const instruction of program.idl.instructions) {
        const discriminator = instruction.discriminator;
        const discLength = discriminator.length;

        // Check if instruction data is long enough
        if (data.length < discLength) {
            continue;
        }

        // Compare discriminator bytes
        const matches = discriminator.every((byte, index) => data[index] === byte);

        if (matches) {
            // Found matching instruction
            if (discLength < 8) {
                // For custom short discriminators, we need to create a modified IDL
                // with padded discriminators for the BorshInstructionCoder
                const paddingBytes = new Array(8 - discLength).fill(0);
                const paddedDiscriminator = [...discriminator, ...paddingBytes];

                // Create modified IDL with padded discriminator
                // Deep clone to avoid reference issues
                const modifiedIdl: Idl = {
                    ...program.idl,
                    instructions: program.idl.instructions.map(ix =>
                        ix.name === instruction.name ? { ...ix, discriminator: paddedDiscriminator } : { ...ix },
                    ),
                };

                // Pad the instruction data
                const argsData = new Uint8Array(data.subarray(discLength));
                const paddedData = new Uint8Array(paddedDiscriminator.length + argsData.length);
                paddedData.set(paddedDiscriminator, 0);
                paddedData.set(argsData, paddedDiscriminator.length);

                try {
                    const coder = new BorshInstructionCoder(modifiedIdl);
                    const decoded = coder.decode(paddedData as any);
                    return decoded;
                } catch (_error) {
                    // If Borsh decoding fails, return basic instruction info
                    return { data: {}, name: instruction.name };
                }
            } else {
                // Standard 8-byte discriminator - use normal decoder
                try {
                    const coder = new BorshInstructionCoder(program.idl);
                    const decoded = coder.decode(data as any);
                    return decoded;
                } catch (_error) {
                    // If Borsh decoding fails, return basic instruction info
                    return { data: {}, name: instruction.name };
                }
            }
        }
    }

    return null;
}

export function getAnchorNameForInstruction(ix: TransactionInstruction, program: Program): string | null {
    if (instructionIsSelfCPI(ix.data)) {
        return ANCHOR_SELF_CPI_NAME;
    }

    // Try custom discriminator matching first
    let decodedIx = decodeInstructionWithCustomDiscriminator(ix.data, program);

    // Fall back to standard Anchor decoder if custom matching fails
    if (!decodedIx) {
        const coder = new BorshInstructionCoder(program.idl);
        try {
            decodedIx = coder.decode(ix.data);
        } catch (error) {
            Logger.debug('[utils:anchor] Error while decoding instruction for program', {
                discriminator: ix.data.slice(0, Math.min(8, ix.data.length)),
                error,
                programId: program.programId.toString(),
            });
        }
    }

    if (!decodedIx) {
        return null;
    }

    const _ixTitle = decodedIx.name;
    return _ixTitle.charAt(0).toUpperCase() + _ixTitle.slice(1);
}

type IdlAccountItem = {
    name: string;
    isMut: boolean;
    isSigner: boolean;
    pda?: object;
    accounts?: IdlAccountItem[];
};

export type FlattenedIdlAccount = {
    name: string;
    isMut: boolean;
    isSigner: boolean;
    pda?: object;
    isNested?: boolean;
    nestingLevel?: number;
    isGroupHeader?: boolean;
};

/**
 * Flattens nested account structures while preserving hierarchy for display.
 * For nested accounts like:
 *   { name: "withdrawAccounts", accounts: [{ name: "owner" }, { name: "reserve" }] }
 * Returns a flat array with group headers:
 *   [
 *     { name: "withdrawAccounts", isGroupHeader: true, nestingLevel: 0 },
 *     { name: "owner", isNested: true, nestingLevel: 1, ... },
 *     { name: "reserve", isNested: true, nestingLevel: 1, ... }
 *   ]
 */
function flattenIdlAccounts(accounts: IdlAccountItem[], nestingLevel = 0): FlattenedIdlAccount[] {
    const result: FlattenedIdlAccount[] = [];

    for (const account of accounts) {
        if (account.accounts && account.accounts.length > 0) {
            // This is a nested account structure - add a group header
            result.push({
                isGroupHeader: true,
                isMut: account.isMut,
                isSigner: account.isSigner,
                name: account.name,
                nestingLevel,
                pda: account.pda,
            });
            // Recursively flatten nested accounts with increased nesting level
            result.push(...flattenIdlAccounts(account.accounts, nestingLevel + 1));
        } else {
            // This is a regular account
            result.push({
                isMut: account.isMut,
                isNested: nestingLevel > 0,
                isSigner: account.isSigner,
                name: account.name,
                nestingLevel,
                pda: account.pda,
            });
        }
    }

    return result;
}

export function getAnchorAccountsFromInstruction(
    decodedIx: { name: string } | null,
    program: Program,
): FlattenedIdlAccount[] | null {
    if (decodedIx) {
        // get ix accounts
        const idlInstructions = program.idl.instructions.filter(ix => ix.name === decodedIx.name);
        if (idlInstructions.length === 0) {
            return null;
        }
        const accounts = idlInstructions[0].accounts as IdlAccountItem[];
        // Flatten nested account structures while preserving hierarchy
        return flattenIdlAccounts(accounts);
    }
    return null;
}

export function anchorInstructionArgs(
    ixArgs: object,
    ixType: Pick<IdlInstruction, 'name' | 'args'>,
    idl: Idl,
): InstructionArg[] {
    return Object.entries(ixArgs).map(([key, value]) =>
        argOrFallback({ data: ixArgs, key, typeName: ixType.name }, () => {
            const fieldDef = ixType.args.find(ixDefArg => ixDefArg.name === key);
            if (!fieldDef) {
                throw Error(`Could not find expected ${key} field on account type definition for ${ixType.name}`);
            }
            return anchorArg(key, value, fieldDef.type, idl);
        }),
    );
}

export function anchorAccountArgs(accountData: object, accountType: IdlTypeDef, idl: Idl): InstructionArg[] {
    return Object.entries(accountData).map(([key, value], index) =>
        argOrFallback({ data: accountData, key, typeName: accountType.name }, () => {
            if (accountType.type.kind !== 'struct') {
                throw Error(`Account ${accountType.name} is of type ${accountType.type.kind} (expected: 'struct')`);
            }
            const fieldDef = getFieldDef(accountType.type.fields, key, index);
            if (!fieldDef) {
                throw Error(`Could not find expected ${key} field on account type definition for ${accountType.name}`);
            }
            return anchorArg(key, value, fieldDef, idl);
        }),
    );
}

// A field that does not match the IDL shows the whole decoded object, so no data is lost.
function argOrFallback(
    { data, key, typeName }: { data: object; key: string; typeName: string },
    toArg: () => InstructionArg,
): InstructionArg {
    try {
        return toArg();
    } catch (error) {
        Logger.debug('[utils:anchor] Error while displaying IDL-based account data', { error });
        return { kind: 'leaf', name: key, type: typeName, value: { kind: 'json', value: data } };
    }
}

function getFieldDef(fields: IdlDefinedFields | undefined, key: string, index: number): IdlType | undefined {
    if (!fields || fields.length === 0) {
        return undefined;
    }
    if (typeof fields[0] === 'string') {
        return (fields as IdlType[]).find((ixDefArg, argIndex) => argIndex === index);
    } else {
        return (fields as IdlField[]).find(ixDefArg => ixDefArg.name === key)?.type;
    }
}

const NUMBER_TYPES: ReadonlySet<IdlType> = new Set([
    'u8',
    'i8',
    'u16',
    'i16',
    'u32',
    'i32',
    'f32',
    'u64',
    'i64',
    'f64',
    'u128',
    'i128',
    'u256',
    'i256',
]);

function anchorArg(key: string, value: any, type: IdlType, idl: Idl): InstructionArg {
    const name = camelToTitleCase(key);

    if (value === undefined) {
        return leaf(name, type, { kind: 'text', value: 'null' });
    }
    if (NUMBER_TYPES.has(type)) {
        // `toString` keeps every digit of a BN, which `toNumber` would round.
        return leaf(name, type, { kind: 'text', value: numberWithSeparator(value.toString()) });
    }
    if (type === 'bool') {
        return leaf(name, type, { kind: 'text', value: String(value) });
    }
    if (type === 'string') {
        return leaf(name, type, { kind: 'string', value: String(value) });
    }
    if (type === 'bytes') {
        return leaf(name, type, { kind: 'string', value: toBase64(value as Uint8Array) });
    }
    if (type === 'pubkey') {
        return leaf(name, type, { address: toKitAddress(value), kind: 'address' });
    }
    if (typeof type === 'string') {
        Logger.debug('[utils:anchor] Impossible type', { type });
        return { kind: 'leaf', name, type: '', value: { kind: 'text', value: '???' } };
    }
    if ('defined' in type) {
        return definedArg({ idl, name, type, value });
    }
    if ('option' in type) {
        return value === null
            ? leaf(name, type, { kind: 'text', value: 'Not provided' })
            : anchorArg(key, value, type.option, idl);
    }
    if ('vec' in type) {
        return group(name, typeDisplayName(type), itemArgs(value, type.vec, idl));
    }
    if ('array' in type) {
        return group(name, typeDisplayName(type), itemArgs(value, type.array[0], idl));
    }
    Logger.debug('[utils:anchor] Impossible type', { type: type as unknown as string });
    return { kind: 'leaf', name, type: '', value: { kind: 'text', value: '???' } };
}

function definedArg({
    idl,
    name,
    type,
    value,
}: {
    idl: Idl;
    name: string;
    type: Extract<IdlType, { defined: unknown }>;
    value: any;
}): InstructionArg {
    const fieldType = idl.types?.find(t => t.name === type.defined.name);
    if (!fieldType) {
        throw Error(`Could not type definition for ${type.defined} field in IDL`);
    }
    if (fieldType.type.kind === 'struct') {
        const structFields = fieldType.type.fields;
        const children = Object.entries(value).map(([innerKey, innerValue]) => {
            const innerFieldType = getFieldDef(structFields, innerKey, 0);
            if (!innerFieldType) {
                throw Error(`Could not type definition for ${innerKey} field in user-defined struct ${fieldType.name}`);
            }
            return anchorArg(innerKey, innerValue, innerFieldType, idl);
        });
        return group(name, typeDisplayName(type), children);
    }
    if (fieldType.type.kind === 'enum') {
        const enumVariantName = Object.keys(value)[0];
        const variant = fieldType.type.variants.find(
            val => val.name.toLocaleLowerCase() === enumVariantName.toLocaleLowerCase(),
        );
        const variantFields = variant?.fields;
        if (!variantFields) {
            return leaf(name, { enum: type.defined.name }, { kind: 'text', value: camelToTitleCase(enumVariantName) });
        }
        const children = Object.entries(value[enumVariantName]).map(([innerKey, innerValue], index) => {
            const innerFieldType = variantFields[index];
            if (!innerFieldType) {
                throw Error(`Could not type definition for ${innerKey} field in user-defined struct ${fieldType.name}`);
            }
            const innerType =
                typeof innerFieldType === 'object' && 'name' in innerFieldType ? innerFieldType.type : innerFieldType;
            return anchorArg(innerKey, innerValue, innerType, idl);
        });
        return group(name, typeDisplayName({ enum: enumVariantName }), children);
    }
    throw Error(`Unsupported type kind: ${fieldType.type.kind}`);
}

function itemArgs(items: unknown[], itemType: IdlType, idl: Idl): InstructionArg[] {
    return items.map((item, i) => anchorArg(`#${i}`, item, itemType, idl));
}

function leaf(
    name: string,
    type: IdlType | { enum: string },
    value: Extract<InstructionArg, { kind: 'leaf' }>['value'],
): InstructionArg {
    return { kind: 'leaf', name, type: typeDisplayName(type), value };
}

function group(name: string, type: string, children: InstructionArg[]): InstructionArg {
    const [first, ...rest] = children;
    return first ? { children: [first, ...rest], kind: 'group', name, type } : { kind: 'empty', name, type };
}

function typeDisplayName(
    type:
        | IdlType
        | {
              enum: string;
          },
): string {
    switch (type) {
        case 'bool':
        case 'u8':
        case 'i8':
        case 'u16':
        case 'i16':
        case 'u32':
        case 'i32':
        case 'f32':
        case 'u64':
        case 'i64':
        case 'f64':
        case 'u128':
        case 'i128':
        case 'i256':
        case 'u256':
            return type;
        case 'bytes':
            return 'bytes (Base64)';
        case 'string':
            return 'string';
        case 'pubkey':
            return 'PublicKey';
        default:
            if ('enum' in type) return `${type.enum} (enum)`;
            if ('defined' in type) return type.defined.name;
            if ('option' in type) return `${typeDisplayName(type.option)} (optional)`;
            if ('vec' in type) return `${typeDisplayName(type.vec)}[]`;
            if ('array' in type) return `${typeDisplayName(type.array[0])}[${type.array[1]}]`;
            return 'unknown';
    }
}
