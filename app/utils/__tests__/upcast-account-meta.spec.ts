import { Keypair } from '@solana/web3.js';

import { upcastAccountMeta } from '../parsed-tx';

describe('upcastAccountMeta', () => {
    test('should return IAccountMeta compatible data', async () => {
        const pubkey = Keypair.generate().publicKey;
        expect(upcastAccountMeta({ isSigner: false, isWritable: false, pubkey })).toEqual({
            address: pubkey.toString(),
            role: 0,
        });
    });
});
