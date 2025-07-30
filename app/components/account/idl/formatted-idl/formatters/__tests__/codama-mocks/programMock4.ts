/* eslint-disable */
export default {
    kind: 'rootNode',
    standard: 'codama',
    version: '1.2.11',
    program: {
        kind: 'programNode',
        name: 'programMock4',
        publicKey: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        version: '0.3.4',
        origin: 'anchor',
        docs: [],
        accounts: [
            {
                kind: 'accountNode',
                name: 'whirlpool',
                size: 653,
                docs: [],
                data: {
                    kind: 'structTypeNode',
                    fields: [
                        {
                            kind: 'structFieldTypeNode',
                            name: 'rewardInfos',
                            docs: [],
                            type: {
                                kind: 'arrayTypeNode',
                                item: {
                                    kind: 'definedTypeLinkNode',
                                    name: 'whirlpoolRewardInfo',
                                },
                                count: {
                                    kind: 'fixedCountNode',
                                    value: 3,
                                },
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'tickSpacing',
                            docs: [],
                            type: {
                                kind: 'numberTypeNode',
                                format: 'u16',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'tokenMintA',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'tokenVaultA',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                    ],
                },
                discriminators: [],
            },
        ],
        instructions: [
            {
                kind: 'instructionNode',
                name: 'initializePool',
                docs: [],
                optionalAccountStrategy: 'programId',
                accounts: [
                    {
                        kind: 'instructionAccountNode',
                        name: 'whirlpoolsConfig',
                        isWritable: false,
                        isSigner: false,
                        isOptional: false,
                        docs: [],
                    },
                    {
                        kind: 'instructionAccountNode',
                        name: 'tokenMintA',
                        isWritable: false,
                        isSigner: false,
                        isOptional: false,
                        docs: [],
                    },
                ],
                arguments: [
                    {
                        kind: 'instructionArgumentNode',
                        name: 'tickSpacing',
                        docs: [],
                        type: {
                            kind: 'numberTypeNode',
                            format: 'u16',
                        },
                    },
                    {
                        kind: 'instructionArgumentNode',
                        name: 'initialSqrtPrice',
                        docs: [],
                        type: {
                            kind: 'arrayTypeNode',
                            item: {
                                kind: 'numberTypeNode',
                                format: 'u64',
                            },
                            count: {
                                kind: 'fixedCountNode',
                                value: 2,
                            },
                        },
                    },
                ],
                discriminators: [],
            },
        ],
        definedTypes: [
            {
                kind: 'definedTypeNode',
                name: 'whirlpoolRewardInfo',
                docs: [],
                type: {
                    kind: 'structTypeNode',
                    fields: [
                        {
                            kind: 'structFieldTypeNode',
                            name: 'mint',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'vault',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'authority',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'emissionsPerSecondX64',
                            docs: [],
                            type: {
                                kind: 'numberTypeNode',
                                format: 'u128',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'growthGlobalX64',
                            docs: [],
                            type: {
                                kind: 'numberTypeNode',
                                format: 'u128',
                            },
                        },
                    ],
                },
            },
            {
                kind: 'definedTypeNode',
                name: 'remainingAccountsInfo',
                docs: [],
                type: {
                    kind: 'structTypeNode',
                    fields: [
                        {
                            kind: 'structFieldTypeNode',
                            name: 'accountsType',
                            docs: [],
                            type: {
                                kind: 'definedTypeLinkNode',
                                name: 'accountsType',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'optionalAccounts',
                            docs: [],
                            type: {
                                kind: 'optionTypeNode',
                                item: {
                                    kind: 'arrayTypeNode',
                                    item: {
                                        kind: 'booleanTypeNode',
                                    },
                                    count: {
                                        kind: 'fixedCountNode',
                                        value: 3,
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            {
                kind: 'definedTypeNode',
                name: 'accountsType',
                docs: [],
                type: {
                    kind: 'enumTypeNode',
                    variants: [
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'TokenTransferHooks',
                        },
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'TokenExtraAccountMetas',
                        },
                    ],
                    size: {
                        kind: 'enumSizeExactNode',
                        size: 1,
                    },
                },
            },
        ],
        pdas: [],
        errors: [],
    },
    additionalPrograms: [],
};
