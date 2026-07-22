// Generated from ./memo.pmp.idl.json by scripts/generate-codama-literals.mjs — edit the JSON, then re-run (pretest does).
export const memoIdl = {
    kind: 'rootNode',
    program: {
        kind: 'programNode',
        pdas: [],
        accounts: [],
        instructions: [
            {
                kind: 'instructionNode',
                accounts: [],
                arguments: [
                    {
                        kind: 'instructionArgumentNode',
                        name: 'memo',
                        type: {
                            kind: 'stringTypeNode',
                            encoding: 'utf8',
                        },
                        docs: [],
                    },
                ],
                remainingAccounts: [
                    {
                        kind: 'instructionRemainingAccountsNode',
                        value: {
                            kind: 'argumentValueNode',
                            name: 'signers',
                        },
                        isOptional: true,
                        isSigner: true,
                    },
                ],
                name: 'addMemo',
                idlName: 'addMemo',
                docs: [],
                optionalAccountStrategy: 'programId',
            },
        ],
        definedTypes: [],
        errors: [],
        name: 'memo',
        prefix: '',
        publicKey: 'Memo4c2pN8afCj432Lb7RMVKi9PbQnnW7ewFFaV3oAH',
        version: '4.0.0',
    },
    additionalPrograms: [],
    standard: 'codama',
    version: '1.0.0',
} as const;
