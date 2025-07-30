/* eslint-disable */
export default {
    kind: 'rootNode',
    standard: 'codama',
    version: '1.0.0',
    program: {
        kind: 'programNode',
        name: 'programMock2',
        publicKey: 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S',
        version: '0.0.0',
        pdas: [
            {
                kind: 'pdaNode',
                name: 'canonical',
                docs: ['The canonical derivation for metadata accounts managed by the program authority itself.'],
                seeds: [
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'program',
                        docs: ['The program to which the metadata belongs.'],
                        type: {
                            kind: 'publicKeyTypeNode',
                        },
                    },
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'seed',
                        docs: ['The seed deriving the metadata account.'],
                        type: {
                            kind: 'definedTypeLinkNode',
                            name: 'seed',
                        },
                    },
                ],
            },
            {
                kind: 'pdaNode',
                name: 'metadata',
                docs: ['The derivation for metadata accounts, canonical or not.'],
                seeds: [
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'program',
                        docs: ['The program to which the metadata belongs.'],
                        type: {
                            kind: 'publicKeyTypeNode',
                        },
                    },
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'authority',
                        docs: ['The third-party authority managing this metadata account, if non-canonical.'],
                        type: {
                            kind: 'optionTypeNode',
                            item: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                    },
                    {
                        kind: 'variablePdaSeedNode',
                        name: 'seed',
                        docs: ['The seed deriving the metadata account.'],
                        type: {
                            kind: 'definedTypeLinkNode',
                            name: 'seed',
                        },
                    },
                ],
            },
        ],
        accounts: [
            {
                kind: 'accountNode',
                name: 'metadata',
                docs: [],
                data: {
                    kind: 'structTypeNode',
                    fields: [
                        {
                            kind: 'structFieldTypeNode',
                            name: 'discriminator',
                            docs: [],
                            type: {
                                kind: 'definedTypeLinkNode',
                                name: 'accountDiscriminator',
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
                    ],
                },
                pda: {
                    kind: 'pdaLinkNode',
                    name: 'metadata',
                },
            },
        ],
        instructions: [
            {
                kind: 'instructionNode',
                name: 'initialize',
                docs: [],
                optionalAccountStrategy: 'programId',
                accounts: [
                    {
                        kind: 'instructionAccountNode',
                        name: 'metadata',
                        docs: ['Metadata account the initialize.'],
                        isSigner: false,
                        isWritable: true,
                        defaultValue: {
                            kind: 'pdaValueNode',
                            pda: {
                                kind: 'pdaLinkNode',
                                name: 'metadata',
                            },
                        },
                    },
                    {
                        kind: 'instructionAccountNode',
                        name: 'authority',
                        docs: ['Authority (for canonical, must match program upgrade authority).'],
                        isSigner: true,
                        isWritable: false,
                    },
                ],
                arguments: [],
                discriminators: [],
            },
        ],
        definedTypes: [
            {
                kind: 'definedTypeNode',
                name: 'accountDiscriminator',
                docs: [],
                type: {
                    kind: 'enumTypeNode',
                    variants: [
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'Buffer',
                        },
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'Metadata',
                        },
                    ],
                    size: {
                        kind: 'enumSizeExactNode',
                        size: 1,
                    },
                },
            },
            {
                kind: 'definedTypeNode',
                name: 'seed',
                docs: [],
                type: {
                    kind: 'fixedSizeTypeNode',
                    size: 16,
                    type: {
                        kind: 'bytesTypeNode',
                    },
                },
            },
        ],
        errors: [],
    },
    additionalPrograms: [],
};
