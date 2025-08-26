import {
    Idl,
    IdlAccount,
    IdlDefinedFields,
    IdlDefinedFieldsNamed,
    IdlEvent,
    IdlInstruction,
    IdlInstructionAccount,
    IdlSeed,
    IdlType,
    IdlTypeArray,
    IdlTypeDef,
    IdlTypeDefTy,
} from '@coral-xyz/anchor/dist/cjs/idl';
import { bytesToHex } from '@noble/hashes/utils';
import { camelCase } from 'change-case';
import { useMemo } from 'react';

import { FieldType, FormattedIdl, PdaData, StructField } from './FormattedIdl';

function parseStructFields(fields: IdlDefinedFields): StructField[] | null {
    // Handle struct with named fields or tuple fields
    if (!fields) {
        return null;
    } else if (typeof fields[0] === 'object' && 'name' in (fields as IdlDefinedFieldsNamed)[0]) {
        // Named fields
        return (fields as IdlDefinedFieldsNamed).map(field => ({
            docs: field.docs || [],
            name: camelCase(field.name),
            type: parseIdlType(field.type),
        }));
    } else {
        // Tuple fields
        return (fields as IdlType[]).map(field => ({
            type: parseIdlType(field),
        }));
    }
}

function parseIdlTypeDef(type: IdlTypeDefTy): FieldType | null {
    switch (type.kind) {
        case 'struct': {
            if (!type.fields) {
                return null;
            }
            const fields = parseStructFields(type.fields);
            return !fields ? null : { fields, kind: 'struct' };
        }
        case 'enum': {
            const variants = type.variants.map(variant => {
                const fields = variant.fields && parseStructFields(variant.fields);
                if (!fields) return variant.name;
                if (!fields[0].name) {
                    // fields are tuple-like
                    return `${variant.name} [${fields.map(f => f.type).join(', ')}]`;
                }
                // fields are named
                const structFields = fields.reduce<Record<string, string>>((acc, field) => {
                    if (!field.name) return acc;
                    acc[field.name] = field.type;
                    return acc;
                }, {});

                return `${variant.name} ${JSON.stringify(structFields)}`;
            });
            return { kind: 'enum', variants };
        }
        case 'type':
            return { kind: 'type', type: parseIdlType(type.alias) };
        default:
            return { kind: 'unknown', type: JSON.stringify(type) };
    }
}

function parseIdlType(type: IdlType): string {
    if (typeof type === 'string') return type;
    if ('defined' in type) {
        return typeof type.defined === 'string' ? type.defined : type.defined.name;
    }
    if ('array' in type) return renderArray(type);
    if ('vec' in type) return `vec(${parseIdlType(type.vec)})`;
    if ('option' in type) return `option(${parseIdlType(type.option)})`;
    if ('coption' in type) return `coption(${parseIdlType(type.coption)})`;
    return JSON.stringify(type);
}

function renderArray(arrayType: IdlTypeArray) {
    return `array(${parseIdlType(arrayType.array[0])}, ${getArrayTypeLen(arrayType.array[1])})`;
}

function getArrayTypeLen(arrayLen: IdlTypeArray['array'][1]) {
    if (typeof arrayLen === 'number') {
        return arrayLen;
    } else if ('generic' in arrayLen) {
        return arrayLen.generic;
    } else {
        return JSON.stringify(arrayLen);
    }
}

function getUniqPdaAccountsFromIxs(ixs: IdlInstruction[]): IdlInstructionAccount[] {
    const uniqPdas = new Map<string, IdlInstructionAccount>();
    ixs.forEach(ix => {
        ix.accounts.forEach(acc => {
            if ('accounts' in acc) {
                acc.accounts.forEach(a => {
                    if (a.pda) uniqPdas.set(a.name, a);
                });
            } else if ('pda' in acc && acc.pda) {
                uniqPdas.set(acc.name, acc);
            }
        });
    });
    return Array.from(uniqPdas.values());
}

function getPdaSeeds(seeds: IdlSeed[], idl: Idl): PdaData['seeds'] {
    return seeds.map(seed => {
        if (seed.kind === 'const') {
            return {
                kind: 'type',
                name: bytesToHex(Uint8Array.from([...seed.value])),
                type: 'seed',
            };
        } else if (seed.kind === 'arg') {
            const arg = idl.instructions
                .find(ix => {
                    return ix.args.some(arg => arg.name === seed.path);
                })
                ?.args.find(arg => arg.name === seed.path);
            const argType = arg ? parseIdlType(arg.type) : undefined;
            return {
                kind: 'type',
                name: seed.path,
                type: `arg${argType ? `: ${argType}` : ''}`,
            };
        } else if (seed.kind === 'account') {
            return {
                kind: 'type',
                name: seed.path,
                type: 'pubkey',
            };
        }
        throw new Error(`Unsupported seed kind: ${seed}`);
    });
}

export function useFormatAnchorIdl(idl?: Idl): FormattedIdl | null {
    const formattedIdl = useMemo(() => {
        if (!idl) return null;
        const typesMap = new Map<string, IdlTypeDef>(idl.types?.map(item => [item.name, item]) || []);
        const accountsMap = new Map<string, IdlAccount>(idl.accounts?.map(item => [item.name, item]) || []);
        const eventsMap = new Map<string, IdlEvent>(idl.events?.map(item => [item.name, item]) || []);
        const pdas = getUniqPdaAccountsFromIxs(idl.instructions);

        const formattedIdl: FormattedIdl = {
            accounts: idl.accounts?.map(acc => {
                const accType = typesMap.get(acc.name)?.type as IdlTypeDefTy;
                return {
                    docs: (acc as any).docs || [],
                    fieldType: parseIdlTypeDef(accType),
                    name: acc.name,
                };
            }),
            constants: idl.constants?.map(constant => {
                let maybeValue = constant.value;
                try {
                    maybeValue = JSON.parse(constant.value);
                } catch (e) {
                    console.error(`Can not parse constant: ${constant.name}`, e);
                }

                return {
                    docs: (constant as any).docs || [],
                    name: constant.name,
                    type: parseIdlType(constant.type),
                    value: maybeValue,
                };
            }),
            errors: idl.errors?.map(err => ({
                code: err.code.toString(),
                message: err.msg || '',
                name: err.name,
            })),
            events: idl.events?.map(event => {
                const eventType = typesMap.get(event.name)?.type as IdlTypeDefTy;
                return {
                    docs: [],
                    fieldType: parseIdlTypeDef(eventType),
                    name: event.name,
                };
            }),
            instructions: idl.instructions.map(ix => {
                return {
                    accounts: ix.accounts.map(acc => {
                        if ('accounts' in acc) {
                            return {
                                accounts: acc.accounts.map(a => ({
                                    docs: a?.docs || [],
                                    name: camelCase(a.name),
                                    optional: !!a.optional,
                                    pda: !!a.pda,
                                    signer: !!a.signer,
                                    writable: !!a.writable,
                                })),
                                docs: ix?.docs || [],
                                name: camelCase(acc.name),
                            };
                        }
                        return {
                            docs: acc?.docs || [],
                            name: camelCase(acc.name),
                            optional: !!acc.optional,
                            pda: !!acc.pda,
                            signer: !!acc.signer,
                            writable: !!acc.writable,
                        };
                    }),
                    args: ix.args.map(arg => ({
                        docs: arg.docs || [],
                        name: camelCase(arg.name),
                        type: parseIdlType(arg.type),
                    })),
                    docs: ix?.docs || [],
                    name: camelCase(ix.name),
                };
            }),
            pdas: pdas.map(pda => {
                return {
                    docs: [],
                    name: camelCase(pda.name),
                    seeds: getPdaSeeds(pda.pda?.seeds || [], idl),
                };
            }),
            types: idl.types
                ?.filter(t => !accountsMap.get(t.name) && !eventsMap.get(t.name))
                .map(t => ({
                    docs: t?.docs || [],
                    fieldType: parseIdlTypeDef(t.type),
                    name: t.name,
                })),
        };
        return formattedIdl;
    }, [idl]);
    return formattedIdl;
}
