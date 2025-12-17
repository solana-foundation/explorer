/* eslint-disable */
export default {
    kind: 'rootNode',
    standard: 'codama',
    version: '1.3.0',
    program: {
        kind: 'programNode',
        name: 'programMock3',
        publicKey: 'GB1MrbwXyGR3gqTYpfEpa2Mx9avAxv3dQpzVQ5nWJctu',
        version: '0.1.0',
        origin: 'anchor',
        docs: [],
        accounts: [
            {
                kind: 'accountNode',
                name: 'config',
                size: 130,
                docs: ['* Initialize'],
                data: {
                    kind: 'structTypeNode',
                    fields: [
                        {
                            kind: 'structFieldTypeNode',
                            name: 'admin',
                            docs: [],
                            type: {
                                kind: 'publicKeyTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'paused',
                            docs: [],
                            type: {
                                kind: 'booleanTypeNode',
                            },
                        },
                        {
                            kind: 'structFieldTypeNode',
                            name: 'noticePeriods',
                            docs: [],
                            type: {
                                kind: 'arrayTypeNode',
                                item: {
                                    kind: 'numberTypeNode',
                                    format: 'u64',
                                },
                                count: {
                                    kind: 'fixedCountNode',
                                    value: 5,
                                },
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
                name: 'initialize',
                docs: [],
                optionalAccountStrategy: 'programId',
                accounts: [
                    {
                        kind: 'instructionAccountNode',
                        name: 'config',
                        isWritable: true,
                        isSigner: false,
                        isOptional: false,
                        docs: [],
                    },
                    {
                        kind: 'instructionAccountNode',
                        name: 'admin',
                        isWritable: false,
                        isSigner: true,
                        isOptional: false,
                        docs: [],
                    },
                ],
                arguments: [
                    {
                        kind: 'instructionArgumentNode',
                        name: 'noticePeriods',
                        docs: [],
                        type: {
                            kind: 'arrayTypeNode',
                            item: {
                                kind: 'numberTypeNode',
                                format: 'u64',
                            },
                            count: {
                                kind: 'fixedCountNode',
                                value: 5,
                            },
                        },
                    },
                ],
                discriminators: [],
            },
        ],
        definedTypes: [],
        pdas: [],
        errors: [
            {
                kind: 'errorNode',
                name: 'mathOverflow',
                code: 6000,
                message: 'Math error',
                docs: ['MathOverflow: Math error'],
            },
        ],
    },
    additionalPrograms: [],
};
