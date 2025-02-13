import { MPL_CORE_PROGRAM_ID } from '@metaplex-foundation/mpl-core';
import { base64 } from '@metaplex-foundation/umi/serializers';
import { PublicKey } from '@solana/web3.js';
import { TextDecoder } from 'util';
global.TextDecoder = TextDecoder;

import { parseCoreCollectionAccount } from '../isCoreAccount';

const fixture = "BZkfxlK1a39iYw1LNZxpxSlK1cpA0n7jdogmZES6wNdxDwAAAENvcmUgQ29sbGVjdGlvbj8AAABodHRwczovL2Fyd2VhdmUubmV0LzM1blptdXVVbEsxaVk5Ry1kbjV1X3JhSV9sd0dvTm9SOVRyaE9LVVBlejACAAAAAgAAAA==";

describe('parseCoreCollectionAccount', () => {
    it('parses a Collection', () => {
        const buffer = base64.serialize(fixture);
        const coreAccount = parseCoreCollectionAccount({
            data: { raw: buffer as Buffer },
            executable: false,
            lamports: 1,
            owner: new PublicKey(MPL_CORE_PROGRAM_ID),
            pubkey: new PublicKey('4EhtDnqQpyMTRwTTxokQKUthV5t9SsJfqUEGoqVCsMxt'),
            space: buffer.length,
        });
        expect(coreAccount!.uri).toBe('https://arweave.net/35nZmuuUlK1iY9G-dn5u_raI_lwGoNoR9TrhOKUPez0');
    });
});
