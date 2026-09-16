import { describe, expect, it } from 'vitest';

import { fromUtf8 } from '../bytes';
import { sha256Hex } from '../hash';

describe('sha256Hex', () => {
    it('should hash a known string to the published sha256 vector as lowercase unprefixed hex', () => {
        expect(sha256Hex(fromUtf8('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
});
