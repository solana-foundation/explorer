/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/simple_031.json`.
 */
export type Simple031 = {
    address: '391y4fKGKUEt7n6HuKrkfGYLdkvnk6rvneR7snKe6wzy';
    metadata: {
        name: 'simple031';
        version: '0.1.0';
        spec: '0.1.0';
    };
    instructions: [
        {
            name: 'increment';
            discriminator: [11, 18, 104, 9, 104, 174, 59, 33];
            accounts: [
                {
                    name: 'counter';
                    writable: true;
                },
                {
                    name: 'authority';
                    signer: true;
                    relations: ['counter'];
                },
            ];
            args: [
                {
                    name: 'amount';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'initialize';
            discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
            accounts: [
                {
                    name: 'counter';
                    writable: true;
                    signer: true;
                },
                {
                    name: 'payer';
                    writable: true;
                    signer: true;
                },
                {
                    name: 'systemProgram';
                    address: '11111111111111111111111111111111';
                },
            ];
            args: [];
        },
    ];
    accounts: [
        {
            name: 'counter';
            discriminator: [255, 176, 4, 245, 188, 253, 124, 25];
        },
    ];
    events: [
        {
            name: 'counterIncremented';
            discriminator: [219, 181, 183, 220, 88, 58, 114, 198];
        },
    ];
    errors: [
        {
            code: 6000;
            name: 'overflow';
            msg: 'Counter overflow';
        },
    ];
    types: [
        {
            name: 'counter';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'authority';
                        type: 'pubkey';
                    },
                    {
                        name: 'count';
                        type: 'u64';
                    },
                ];
            };
        },
        {
            name: 'counterIncremented';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'count';
                        type: 'u64';
                    },
                ];
            };
        },
    ];
};
