import { gen } from '@__fixtures__/gen';
import { describe, expect, it } from 'vitest';

import { tokenInfo } from '../../__fixtures__/token-info';
import { toTokenInfoLookup } from '../token-info-lookup';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

describe('toTokenInfoLookup', () => {
    it('should return listed with the token of the mint', () => {
        const result = { kind: 'resolved' as const, tokens: [tokenInfo(MINT_A), tokenInfo(MINT_B)] };

        expect(toTokenInfoLookup(result, MINT_B)).toEqual({ kind: 'listed', token: tokenInfo(MINT_B) });
    });

    it('should return not-listed for a mint the result does not hold', () => {
        expect(toTokenInfoLookup({ kind: 'resolved', tokens: [tokenInfo(MINT_A)] }, MINT_B)).toEqual({
            kind: 'not-listed',
        });
    });

    it('should pass a failure through', () => {
        expect(toTokenInfoLookup({ kind: 'rate-limited' }, MINT_A)).toEqual({ kind: 'rate-limited' });
    });
});
