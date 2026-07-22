// Generated from ./vault.idl.json by scripts/generate-codama-literals.mjs — edit the JSON, then re-run (pretest does).
export const vaultIdl = {
    additionalPrograms: [],
    kind: 'rootNode',
    program: {
        accounts: [
            {
                data: {
                    fields: [
                        {
                            docs: [],
                            kind: 'structFieldTypeNode',
                            name: 'authority',
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            docs: [],
                            kind: 'structFieldTypeNode',
                            name: 'count',
                            type: {
                                endian: 'le',
                                format: 'u64',
                                kind: 'numberTypeNode',
                            },
                        },
                    ],
                    kind: 'structTypeNode',
                },
                discriminators: [
                    {
                        kind: 'sizeDiscriminatorNode',
                        size: 40,
                    },
                ],
                docs: [],
                kind: 'accountNode',
                name: 'vault',
                size: 40,
            },
        ],
        definedTypes: [],
        docs: [],
        errors: [],
        instructions: [
            {
                accounts: [],
                arguments: [
                    {
                        defaultValue: {
                            kind: 'numberValueNode',
                            number: 1,
                        },
                        defaultValueStrategy: 'omitted',
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: 'discriminator',
                        type: {
                            endian: 'le',
                            format: 'u8',
                            kind: 'numberTypeNode',
                        },
                    },
                    {
                        docs: [],
                        kind: 'instructionArgumentNode',
                        name: 'amount',
                        type: {
                            endian: 'le',
                            format: 'u64',
                            kind: 'numberTypeNode',
                        },
                    },
                ],
                discriminators: [
                    {
                        kind: 'fieldDiscriminatorNode',
                        name: 'discriminator',
                        offset: 0,
                    },
                ],
                docs: [],
                kind: 'instructionNode',
                name: 'deposit',
                optionalAccountStrategy: 'programId',
            },
        ],
        kind: 'programNode',
        name: 'vault',
        pdas: [],
        publicKey: '11111111111111111111111111111111',
        version: '1.0.0',
    },
    standard: 'codama',
    version: '1.0.0',
} as const;
