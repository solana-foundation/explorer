import {
    EnumTypeNode,
    InstructionAccountNode,
    InstructionNode,
    PdaNode,
    PdaValueNode,
    RegisteredPdaSeedNode,
    RootNode,
    TypeNode,
    ValueNode,
} from 'codama';
import { useMemo } from 'react';

import { FieldType, FormattedIdl, PdaData, StructField } from './FormattedIdl';

function parseEnumNodeVariants(type: EnumTypeNode): string[] {
    return type.variants.map(variant => {
        switch (variant.kind) {
            case 'enumStructVariantTypeNode':
                return `${variant.name} ${parseTypeNodeFieldType(variant.struct)}`;
            case 'enumTupleVariantTypeNode':
                return `${variant.name} ${parseTypeNodeFieldType(variant.tuple)}`;
            default:
                return variant.name;
        }
    });
}

function parseValueNodeValue(valueNode: ValueNode): string {
    switch (valueNode.kind) {
        case 'arrayValueNode':
            return `array(${valueNode.items.map(item => parseValueNodeValue(item)).join(', ')})`;
        case 'bytesValueNode':
            // TODO: decode data?
            // return `${valueNode.data}: ${valueNode.encoding}`;
            return valueNode.data;
        case 'booleanValueNode':
            return `${valueNode.boolean}`;
        case 'constantValueNode':
            return `${parseValueNodeValue(valueNode.value)}: ${parseTypeNodeFieldType(valueNode.type)}`;
        case 'mapValueNode':
            return JSON.stringify(
                valueNode.entries.map(entry => ({
                    key: parseValueNodeValue(entry.key),
                    value: parseValueNodeValue(entry.value),
                }))
            );
        case 'noneValueNode':
            return 'none';
        case 'enumValueNode':
            return valueNode.variant;
        case 'numberValueNode':
            return valueNode.number.toString();
        case 'publicKeyValueNode':
            return valueNode.publicKey;
        case 'setValueNode':
            return valueNode.items.map(item => parseValueNodeValue(item)).join(', ');
        case 'someValueNode':
            return parseValueNodeValue(valueNode.value);
        case 'stringValueNode':
            return valueNode.string;
        case 'structValueNode':
            return JSON.stringify(
                valueNode.fields.map(field => ({
                    name: field.name,
                    value: parseValueNodeValue(field.value),
                }))
            );
        case 'tupleValueNode':
            return `tuple(${valueNode.items.map(item => parseValueNodeValue(item)).join(', ')})`;
        default:
            return JSON.stringify(valueNode);
    }
}

function parseTypeNodeFieldType(type: TypeNode): string {
    switch (type.kind) {
        case 'amountTypeNode':
            return `amount(${type.number} ${type?.unit} decimals[${type?.decimals}])`;
        case 'booleanTypeNode':
            return 'bool';
        case 'bytesTypeNode':
            return 'bytes';
        case 'arrayTypeNode':
            if (type.count.kind === 'fixedCountNode') {
                return `array(${parseTypeNodeFieldType(type.item)}, ${type.count.value})`;
            }
            return `vec(${parseTypeNodeFieldType(type.item)})`;
        case 'dateTimeTypeNode':
            return `dateTime(${parseTypeNodeFieldType(type.number)})`;
        case 'definedTypeLinkNode':
            return `${type.name}${type.program ? ` (${type.program.name})` : ''}`;
        case 'enumTypeNode':
            console.warn('Handle each node separately');
            return parseEnumNodeVariants(type).join(' | ');
        case 'fixedSizeTypeNode':
            return `array(${parseTypeNodeFieldType(type.type)},${type.size})`;
        case 'hiddenPrefixTypeNode':
            return `prefix(${type.prefix.map(p => p.value).join(', ')}) ${parseTypeNodeFieldType(type.type)}`;
        case 'hiddenSuffixTypeNode':
            return `suffix(${type.suffix.map(s => s.value).join(', ')}) ${parseTypeNodeFieldType(type.type)}`;
        case 'mapTypeNode':
            return `map(${parseTypeNodeFieldType(type.key)}, ${parseTypeNodeFieldType(type.value)})`;
        case 'numberTypeNode':
            return `${type.format}`;
        case 'optionTypeNode':
            return `option(${parseTypeNodeFieldType(type.item)})`;
        case 'postOffsetTypeNode':
            return `postOffset(${parseTypeNodeFieldType(type.type)})`;
        case 'preOffsetTypeNode':
            return `preOffset(${parseTypeNodeFieldType(type.type)})`;
        case 'publicKeyTypeNode':
            return 'pubkey';
        case 'remainderOptionTypeNode':
            return `remainderOption(${parseTypeNodeFieldType(type.item)})`;
        case 'sentinelTypeNode':
            return `sentinel(${type.sentinel.value})`;
        case 'setTypeNode':
            return `set(${parseTypeNodeFieldType(type.item)})`;
        case 'sizePrefixTypeNode':
            return `sizePrefix(${parseTypeNodeFieldType(type.type)})`;
        case 'solAmountTypeNode':
            return `solAmount(${parseTypeNodeFieldType(type.number)})`;
        case 'stringTypeNode':
            return `string:${type.encoding}`;
        case 'structTypeNode':
            console.warn('Handle each node separately');
            return type.fields.map(field => parseTypeNodeFieldType(field.type)).join(', ');
        case 'tupleTypeNode':
            console.warn('Handle each node separately');
            return type.items.map(item => parseTypeNodeFieldType(item)).join(', ');
        case 'zeroableOptionTypeNode':
            return `zeroOption(${parseTypeNodeFieldType(type.item)})`;

        default:
            return JSON.stringify(type);
    }
}

function isIxAccountNodePda(account: InstructionAccountNode): boolean {
    if (account.defaultValue?.kind === 'pdaValueNode') return true;
    if (account.defaultValue?.kind === 'conditionalValueNode') {
        return (
            account.defaultValue.ifTrue?.kind === 'pdaValueNode' ||
            account.defaultValue.ifFalse?.kind === 'pdaValueNode'
        );
    }

    return false;
}

function parseTypeNode(data: TypeNode): FieldType | null {
    if (!data) return null;

    switch (data.kind) {
        case 'structTypeNode': {
            const fields: StructField[] = data.fields.map(field => ({
                name: field.name,
                type: parseTypeNodeFieldType(field.type),
            }));
            return { fields, kind: 'struct' };
        }
        case 'enumTypeNode': {
            const variants: string[] = parseEnumNodeVariants(data);
            return { kind: 'enum', variants };
        }

        default:
            return {
                kind: 'type',
                type: parseTypeNodeFieldType(data),
            };
    }
}

function getUniqPdaNodesFromIxs(ixs: InstructionNode[]): PdaValueNode[] {
    const uniqPdas = new Map<string, PdaValueNode>();
    ixs.forEach(ix => {
        ix.accounts.forEach(acc => {
            if (!isIxAccountNodePda(acc)) return;
            if (acc.defaultValue?.kind === 'conditionalValueNode') {
                const conditionalTruePda = acc.defaultValue.ifTrue as PdaValueNode;
                const conditionalFalsePda = acc.defaultValue.ifFalse as PdaValueNode;
                if (!uniqPdas.get(conditionalTruePda.pda.name)) {
                    uniqPdas.set(conditionalTruePda.pda.name, conditionalTruePda);
                }
                if (!uniqPdas.get(conditionalFalsePda.pda.name)) {
                    uniqPdas.set(conditionalFalsePda.pda.name, conditionalFalsePda);
                }
                return;
            }
            if (uniqPdas.get(acc.name)) return;
            uniqPdas.set(acc.name, acc.defaultValue as PdaValueNode);
        });
    });

    return Array.from(uniqPdas.values());
}

function getSeedName(seed: RegisteredPdaSeedNode): string {
    if (seed.kind === 'variablePdaSeedNode') {
        return seed.name;
    } else if (seed.kind === 'constantPdaSeedNode') {
        return seed.value.kind === 'programIdValueNode' ? 'programId' : parseValueNodeValue(seed.value);
    } else {
        return 'seed kind not supported';
    }
}

function getSeedDocs(seed: RegisteredPdaSeedNode): string[] {
    if (seed.kind === 'variablePdaSeedNode') {
        return seed.docs || [];
    } else if (seed.kind === 'constantPdaSeedNode') {
        return [];
    } else {
        return [];
    }
}

function getSeedsFromPda(pda: PdaNode): PdaData['seeds'] {
    return pda.seeds.map(seed => ({
        docs: getSeedDocs(seed),
        kind: 'type',
        name: getSeedName(seed),
        type: parseTypeNodeFieldType(seed.type),
    }));
}

export function useFormatCodamaIdl(idl?: RootNode): FormattedIdl | null {
    const formattedIdl = useMemo(() => {
        if (!idl) return null;

        const linkedPdas = new Map<string, PdaNode>(idl.program.pdas.map(item => [item.name, item]) || []);
        const uniqPdaNodes = getUniqPdaNodesFromIxs(idl.program.instructions);

        const formattedIdl: FormattedIdl = {
            accounts: idl.program.accounts?.map(acc => ({
                docs: acc.docs || [],
                fieldType: parseTypeNode(acc.data),
                name: acc.name,
            })),
            constants: undefined, // codama does not have constants
            errors: idl.program.errors?.map(err => ({
                code: err.code.toString(),
                message: err.message || '',
                name: err.name,
            })),
            events: undefined, // anchor "events" are in types
            instructions: idl.program.instructions?.map(ix => ({
                accounts: ix.accounts.map(acc => {
                    return {
                        docs: acc.docs || [],
                        name: acc.name,
                        optional: acc.isOptional,
                        pda: isIxAccountNodePda(acc),
                        signer: !!acc.isSigner,
                        writable: acc.isWritable,
                    };
                }),
                args:
                    ix.arguments?.map(arg => ({
                        docs: arg.docs || [],
                        name: arg.name,
                        type: parseTypeNodeFieldType(arg.type),
                    })) || [],
                docs: ix.docs || [],
                name: ix.name,
            })),
            pdas: uniqPdaNodes?.map(pdaValueNode => {
                const { pda } = pdaValueNode;
                const linkedPda = linkedPdas.get(pda.name);
                return {
                    docs: linkedPda?.docs || [],
                    name: pda.name,
                    seeds:
                        pda.kind === 'pdaLinkNode'
                            ? linkedPda
                                ? getSeedsFromPda(linkedPda)
                                : []
                            : getSeedsFromPda(pda),
                };
            }),
            types: idl.program.definedTypes?.map(item => ({
                docs: item.docs || [],
                fieldType: parseTypeNode(item.type),
                name: item.name,
            })),
        };
        return formattedIdl;
    }, [idl]);

    return formattedIdl;
}
