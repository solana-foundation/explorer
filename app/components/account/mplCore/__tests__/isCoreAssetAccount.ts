import { MPL_CORE_PROGRAM_ID } from '@metaplex-foundation/mpl-core';
import { base64 } from '@metaplex-foundation/umi/serializers';
import { PublicKey } from '@solana/web3.js';
import { TextDecoder } from 'util';
global.TextDecoder = TextDecoder;

import { parseCoreNFTAccount } from '../isCoreAccount';

const fixture = "AZkfxlK1a39iYw1LNZxpxSlK1cpA0n7jdogmZES6wNdxAZkfxlK1a39iYw1LNZxpxSlK1cpA0n7jdogmZES6wNdxCgAAAEhlbGxvIENvcmU/AAAAaHR0cHM6Ly9hcndlYXZlLm5ldC8zNW5abXV1VWxLMWlZOUctZG41dV9yYUlfbHdHb05vUjlUcmhPS1VQZXowAA==";

describe('parseCoreAssetAccount', () => {
    it('parses an NFT', () => {
        const buffer = base64.serialize(fixture);
        const coreAccount = parseCoreNFTAccount({
            data: { raw: buffer as Buffer },
            executable: false,
            lamports: 1,
            owner: new PublicKey(MPL_CORE_PROGRAM_ID),
            pubkey: new PublicKey('8KP6Fgx7BsKzuoAq9yYsCS69g9u7MmNUMA9UEfzTZVHo'),
            space: buffer.length,
        });
        expect(coreAccount!.uri).toBe('https://arweave.net/35nZmuuUlK1iY9G-dn5u_raI_lwGoNoR9TrhOKUPez0');
    });
});
