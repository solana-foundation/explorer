import { gen } from '@__fixtures__/gen';
import { is } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { GenesisHashFromString } from '../const';

describe('GenesisHashFromString', () => {
    it('should accept a base58-encoded hash', () => {
        expect(is(gen.blockhash(), GenesisHashFromString)).toBe(true);
    });

    it('should reject an RPC URL', () => {
        expect(is('https://api.mainnet-beta.solana.com', GenesisHashFromString)).toBe(false);
    });
});
