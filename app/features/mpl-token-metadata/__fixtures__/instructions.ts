import { gen } from '@__fixtures__/gen';
import { makeInstruction } from '@__fixtures__/instruction';
import {
    getCreateMetadataAccountV3InstructionDataSerializer,
    MPL_TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { none } from '@metaplex-foundation/umi';
import type { PublicKey } from '@solana/web3.js';

export const KEYS = Array.from({ length: 20 }, (_, n) => gen.publicKey(n + 1));

export function tokenMetadataInstruction(data: Uint8Array | number[], keys: PublicKey[] = []) {
    return makeInstruction({ data, keys, programId: MPL_TOKEN_METADATA_PROGRAM_ID });
}

export function createMetadataAccountV3Data({ sellerFeeBasisPoints = 500, uri = 'https://example.com/nft.json' } = {}) {
    return getCreateMetadataAccountV3InstructionDataSerializer().serialize({
        collectionDetails: none(),
        data: {
            collection: none(),
            creators: none(),
            name: 'My NFT',
            sellerFeeBasisPoints,
            symbol: 'MNFT',
            uri,
            uses: none(),
        },
        isMutable: true,
    });
}
