import { Address } from '@components/common/Address';
import { SolarizedJsonViewer as ReactJson } from '@components/common/JsonViewer';
import { BorshEventCoder, BorshInstructionCoder, Idl, Program } from '@coral-xyz/anchor';
import { IdlDefinedFields } from '@coral-xyz/anchor/dist/cjs/idl';
import { IdlField, IdlInstruction, IdlType, IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { useAnchorProgram } from '@entities/idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { camelToTitleCase, numberWithSeparator, snakeToTitleCase } from '@utils/index';
import React, { Fragment, ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, CornerDownRight } from 'react-feather';

const ANCHOR_SELF_CPI_TAG = Buffer.from('1d9acb512ea545e4', 'hex').reverse();
const ANCHOR_SELF_CPI_NAME = 'Anchor Self Invocation';

export function instructionIsSelfCPI(ixData: Buffer | Uint8Array): boolean {
    const data = Buffer.isBuffer(ixData) ? ixData : Buffer.from(ixData);
    const slice = data.subarray(0, 8);
    return ANCHOR_SELF_CPI_TAG.every((byte, index) => slice[index] === byte);
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
    const data = Buffer.from(eventData, 'base64');

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
                        ev.name === event.name ? { ...ev, discriminator: paddedDiscriminator } : { ...ev }
                    ),
                };

                // Pad the event data
                const eventArgs = data.subarray(discLength);
                const paddedData = new Uint8Array(paddedDiscriminator.length + eventArgs.length);
                paddedData.set(paddedDiscriminator, 0);
                paddedData.set(eventArgs, paddedDiscriminator.length);

                try {
                    const coder = new BorshEventCoder(modifiedIdl);
                    const decoded = coder.decode(Buffer.from(paddedData).toString('base64'));
                    return decoded;
                } catch (error) {
                    return { data: {}, name: event.name };
                }
            } else {
                // Standard 8-byte discriminator - use normal decoder
                try {
                    const coder = new BorshEventCoder(program.idl);
                    const decoded = coder.decode(eventData);
                    return decoded;
                } catch (error) {
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
    const { program } = useAnchorProgram(programId.toString(), url, cluster);
    const programName = getAnchorProgramName(program) || defaultName;
    return <>{programName}</>;
}

/**
 * Decodes an instruction using a custom discriminator matcher that supports variable-length discriminators.
 * Handles both standard 8-byte Anchor discriminators and custom shorter discriminators.
 */
export function decodeInstructionWithCustomDiscriminator(ixData: Buffer | Uint8Array, program: Program): any | null {
    const data = Buffer.isBuffer(ixData) ? ixData : Buffer.from(ixData);

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
                        ix.name === instruction.name ? { ...ix, discriminator: paddedDiscriminator } : { ...ix }
                    ),
                };

                // Pad the instruction data
                const argsData = new Uint8Array(data.subarray(discLength));
                const paddedData = new Uint8Array(paddedDiscriminator.length + argsData.length);
                paddedData.set(paddedDiscriminator, 0);
                paddedData.set(argsData, paddedDiscriminator.length);

                try {
                    const coder = new BorshInstructionCoder(modifiedIdl);
                    const decoded = coder.decode(Buffer.from(paddedData) as any);
                    return decoded;
                } catch (error) {
                    // If Borsh decoding fails, return basic instruction info
                    return { data: {}, name: instruction.name };
                }
            } else {
                // Standard 8-byte discriminator - use normal decoder
                try {
                    const coder = new BorshInstructionCoder(program.idl);
                    const decoded = coder.decode(data as any);
                    return decoded;
                } catch (error) {
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
            console.log(
                'Error while decoding instruction for program',
                program.programId.toString(),
                'with discriminator',
                ix.data.slice(0, Math.min(8, ix.data.length)),
                error
            );
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
    program: Program
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

export function mapIxArgsToRows(ixArgs: any, ixType: IdlInstruction, idl: Idl) {
    return Object.entries(ixArgs).map(([key, value]) => {
        try {
            const fieldDef = ixType.args.find(ixDefArg => ixDefArg.name === key);
            if (!fieldDef) {
                throw Error(`Could not find expected ${key} field on account type definition for ${ixType.name}`);
            }
            return mapField(key, value, fieldDef.type, idl);
        } catch (error: any) {
            console.log('Error while displaying IDL-based account data', error);
            return (
                <tr key={key}>
                    <td>{key}</td>
                    <td>{ixType.name}</td>
                    <td className="metadata-json-viewer m-4">
                        <ReactJson src={ixArgs} />
                    </td>
                </tr>
            );
        }
    });
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

export function mapAccountToRows(accountData: any, accountType: IdlTypeDef, idl: Idl) {
    return Object.entries(accountData).map(([key, value], index) => {
        try {
            if (accountType.type.kind !== 'struct') {
                throw Error(`Account ${accountType.name} is of type ${accountType.type.kind} (expected: 'struct')`);
            }

            const fieldDef: IdlType | undefined = getFieldDef(accountType.type.fields, key, index);
            if (!fieldDef) {
                throw Error(`Could not find expected ${key} field on account type definition for ${accountType.name}`);
            }
            return mapField(key, value as any, fieldDef, idl);
        } catch (error: any) {
            console.log('Error while displaying IDL-based account data', error);
            return (
                <tr key={key}>
                    <td>{key}</td>
                    <td>{accountType.name}</td>
                    <td className="metadata-json-viewer m-4">
                        <ReactJson src={accountData} />
                    </td>
                </tr>
            );
        }
    });
}

function mapField(key: string, value: any, type: IdlType, idl: Idl, keySuffix?: any, nestingLevel = 0): ReactNode {
    let itemKey = key;
    if (/^-?\d+$/.test(keySuffix)) {
        itemKey = `#${keySuffix}`;
    }
    itemKey = camelToTitleCase(itemKey);

    if (value === undefined) {
        return (
            <SimpleRow
                key={keySuffix ? `${key}-${keySuffix}` : key}
                rawKey={key}
                type={type}
                keySuffix={keySuffix}
                nestingLevel={nestingLevel}
            >
                <div>null</div>
            </SimpleRow>
        );
    }

    if (
        type === 'u8' ||
        type === 'i8' ||
        type === 'u16' ||
        type === 'i16' ||
        type === 'u32' ||
        type === 'i32' ||
        type === 'f32' ||
        type === 'u64' ||
        type === 'i64' ||
        type === 'f64' ||
        type === 'u128' ||
        type === 'i128' ||
        type === 'u256' ||
        type === 'i256'
    ) {
        // Convert to string to handle both regular numbers and BN (BigNumber) objects
        // Using toString() avoids 53-bit precision loss that occurs with toNumber() on large values
        const displayValue = value.toString();

        return (
            <SimpleRow
                key={keySuffix ? `${key}-${keySuffix}` : key}
                rawKey={key}
                type={type}
                keySuffix={keySuffix}
                nestingLevel={nestingLevel}
            >
                <div>{numberWithSeparator(displayValue)}</div>
            </SimpleRow>
        );
    } else if (type === 'bool' || type === 'string') {
        return (
            <SimpleRow
                key={keySuffix ? `${key}-${keySuffix}` : key}
                rawKey={key}
                type={type}
                keySuffix={keySuffix}
                nestingLevel={nestingLevel}
            >
                <div>{value.toString()}</div>
            </SimpleRow>
        );
    } else if (type === 'bytes') {
        return (
            <SimpleRow
                key={keySuffix ? `${key}-${keySuffix}` : key}
                rawKey={key}
                type={type}
                keySuffix={keySuffix}
                nestingLevel={nestingLevel}
            >
                <div
                    className="text-lg-start"
                    style={{
                        fontSize: '0.85rem',
                        lineHeight: '1.2',
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        wordBreak: 'break-all',
                    }}
                >
                    {(value as Buffer).toString('base64')}
                </div>
            </SimpleRow>
        );
    } else if (type === 'pubkey') {
        return (
            <SimpleRow
                key={keySuffix ? `${key}-${keySuffix}` : key}
                rawKey={key}
                type={type}
                keySuffix={keySuffix}
                nestingLevel={nestingLevel}
            >
                <Address pubkey={value} link alignRight />
            </SimpleRow>
        );
    } else if ('defined' in type) {
        const fieldType = idl.types?.find(t => t.name === type.defined.name);
        if (!fieldType) {
            throw Error(`Could not type definition for ${type.defined} field in IDL`);
        }
        if (fieldType.type.kind === 'struct') {
            const structFields = fieldType.type.fields;
            return (
                <ExpandableRow
                    fieldName={itemKey}
                    fieldType={typeDisplayName(type)}
                    nestingLevel={nestingLevel}
                    key={keySuffix ? `${key}-${keySuffix}` : key}
                >
                    <Fragment key={keySuffix ? `${key}-${keySuffix}` : key}>
                        {Object.entries(value).map(([innerKey, innerValue]: [string, any]) => {
                            const innerFieldType = getFieldDef(structFields, innerKey, 0);
                            if (!innerFieldType) {
                                throw Error(
                                    `Could not type definition for ${innerKey} field in user-defined struct ${fieldType.name}`
                                );
                            }
                            return mapField(innerKey, innerValue, innerFieldType, idl, key, nestingLevel + 1);
                        })}
                    </Fragment>
                </ExpandableRow>
            );
        } else if (fieldType.type.kind === 'enum') {
            const enumVariantName = Object.keys(value)[0];
            const variant = fieldType.type.variants.find(
                val => val.name.toLocaleLowerCase() === enumVariantName.toLocaleLowerCase()
            );

            return variant && variant.fields ? (
                <ExpandableRow
                    fieldName={itemKey}
                    fieldType={typeDisplayName({ enum: enumVariantName })}
                    nestingLevel={nestingLevel}
                    key={keySuffix ? `${key}-${keySuffix}` : key}
                >
                    <Fragment key={keySuffix ? `${key}-${keySuffix}` : key}>
                        {Object.entries(value[enumVariantName]).map(([innerKey, innerValue]: [string, any], index) => {
                            const innerFieldType = variant.fields![index];
                            if (!innerFieldType) {
                                throw Error(
                                    `Could not type definition for ${innerKey} field in user-defined struct ${fieldType.name}`
                                );
                            }
                            return mapField(
                                innerKey,
                                innerValue,
                                (innerFieldType as any).name
                                    ? (innerFieldType as IdlField).type
                                    : (innerFieldType as IdlType),
                                idl,
                                key,
                                nestingLevel + 1
                            );
                        })}
                    </Fragment>
                </ExpandableRow>
            ) : (
                <SimpleRow
                    key={keySuffix ? `${key}-${keySuffix}` : key}
                    rawKey={key}
                    type={{ enum: type.defined.name }}
                    keySuffix={keySuffix}
                    nestingLevel={nestingLevel}
                >
                    {camelToTitleCase(enumVariantName)}
                </SimpleRow>
            );
        } else {
            throw Error('Unsupported type kind: ' + fieldType.type.kind);
        }
    } else if ('option' in type) {
        if (value === null) {
            return (
                <SimpleRow
                    key={keySuffix ? `${key}-${keySuffix}` : key}
                    rawKey={key}
                    type={type}
                    keySuffix={keySuffix}
                    nestingLevel={nestingLevel}
                >
                    Not provided
                </SimpleRow>
            );
        }
        return mapField(key, value, type.option, idl, key, nestingLevel);
    } else if ('vec' in type) {
        const itemType = type.vec;
        return (
            <ExpandableRow
                fieldName={itemKey}
                fieldType={typeDisplayName(type)}
                nestingLevel={nestingLevel}
                key={keySuffix ? `${key}-${keySuffix}` : key}
            >
                <Fragment key={keySuffix ? `${key}-${keySuffix}` : key}>
                    {(value as any[]).map((item, i) => mapField(key, item, itemType, idl, i, nestingLevel + 1))}
                </Fragment>
            </ExpandableRow>
        );
    } else if ('array' in type) {
        const [itemType] = type.array;
        return (
            <ExpandableRow
                fieldName={itemKey}
                fieldType={typeDisplayName(type)}
                nestingLevel={nestingLevel}
                key={keySuffix ? `${key}-${keySuffix}` : key}
            >
                <Fragment key={keySuffix ? `${key}-${keySuffix}` : key}>
                    {(value as any[]).map((item, i) => mapField(key, item, itemType, idl, i, nestingLevel + 1))}
                </Fragment>
            </ExpandableRow>
        );
    } else {
        console.log('Impossible type:', type);
        return (
            <tr key={keySuffix ? `${key}-${keySuffix}` : key}>
                <td>{camelToTitleCase(key)}</td>
                <td></td>
                <td className="text-lg-end">???</td>
            </tr>
        );
    }
}

function SimpleRow({
    rawKey,
    type,
    keySuffix,
    nestingLevel = 0,
    children,
}: {
    rawKey: string;
    type: IdlType | { enum: string };
    keySuffix?: any;
    nestingLevel: number;
    children?: ReactNode;
}) {
    let itemKey = rawKey;
    if (/^-?\d+$/.test(keySuffix)) {
        itemKey = `#${keySuffix}`;
    }
    itemKey = camelToTitleCase(itemKey);
    return (
        <tr className={nestingLevel > 0 ? 'table-nested-account' : ''}>
            <td>
                <div className="d-flex flex-row align-items-center">
                    {nestingLevel > 0 && <CornerDownRight className="me-2 mb-1" size={14} />}
                    <div>{itemKey}</div>
                </div>
            </td>
            <td>{typeDisplayName(type)}</td>
            <td className="text-lg-end">{children}</td>
        </tr>
    );
}

export function ExpandableRow({
    fieldName,
    fieldType,
    nestingLevel,
    children,
}: {
    fieldName: string;
    fieldType: string;
    nestingLevel: number;
    children: React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <tr className="table-group-header">
                <td>
                    <div className="d-flex flex-row align-items-center">
                        {nestingLevel > 0 && <CornerDownRight className="me-2 mb-1" size={14} />}
                        <div>{fieldName}</div>
                    </div>
                </td>
                <td>{fieldType}</td>
                <td className="text-lg-end" onClick={() => setExpanded(current => !current)}>
                    <div className="c-pointer">
                        {expanded ? (
                            <>
                                <span className="text-info me-2">Collapse</span>
                                <ChevronUp size={15} />
                            </>
                        ) : (
                            <>
                                <span className="text-info me-2">Expand</span>
                                <ChevronDown size={15} />
                            </>
                        )}
                    </div>
                </td>
            </tr>
            {expanded && <>{children}</>}
        </>
    );
}

function typeDisplayName(
    type:
        | IdlType
        | {
              enum: string;
          }
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
