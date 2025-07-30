/* eslint-disable */
export default {
    kind: 'rootNode',
    standard: 'codama',
    version: '1.3.0',
    program: {
        kind: 'programNode',
        name: 'programMock1',
        publicKey: '62gRsAdA6dcbf4Frjp7YRFLpFgdGu8emAACcnnREX3L3',
        version: '0.1.0',
        origin: 'anchor',
        docs: [],
        accounts: [
            {
                kind: 'accountNode',
                name: 'config',
                docs: [],
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
                arguments: [],
                discriminators: [],
            },
        ],
        definedTypes: [
            {
                kind: 'definedTypeNode',
                name: 'gaugeType',
                docs: [],
                type: {
                    kind: 'enumTypeNode',
                    variants: [
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'LP',
                        },
                        {
                            kind: 'enumUnitVariantTypeNode',
                            name: 'SingleAsset',
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
        errors: [
            {
                kind: 'errorNode',
                name: 'programPaused',
                code: 6000,
                message: 'Program is paused',
                docs: ['ProgramPaused: Program is paused'],
            },
            {
                kind: 'errorNode',
                name: 'programIsAlreadyInitialized',
                code: 6001,
                message: 'Program is already initialized',
                docs: ['ProgramIsAlreadyInitialized: Program is already initialized'],
            },
        ],
    },
    additionalPrograms: [],
};
