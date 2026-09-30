import { gen } from '@__fixtures__/gen';
import { describe, expect, it } from 'vitest';

import { isSignatureValid } from '../tx';

describe('isSignatureValid', () => {
    it('should return true for a valid signature', () => {
        expect(isSignatureValid(gen.signature(1))).toBe(true);
    });

    it('should return false for a string with a character outside the base58 alphabet instead of throwing', () => {
        const withLowercaseL = '5xJkP9v71VQpwSxvySDX5hzjZ8vSbnsNJs3EaUSSm9hiaA2c98KlmNQxRtsFgh7Lp';

        expect(() => isSignatureValid(withLowercaseL)).not.toThrow();
        expect(isSignatureValid(withLowercaseL)).toBe(false);
    });

    it('should return false for a base58 string that does not decode to 64 bytes', () => {
        const decodesTo65Bytes =
            '6b3wJC9EDTGQTmdPWvZxPrrsKvSiadsLzGU4EtV3Gp7aohQtWiETdRzAaAK8CfCUAWV2XNHquWvzN3PUAUVE8qtR';

        expect(isSignatureValid(decodesTo65Bytes)).toBe(false);
    });

    it('should return false for a string outside the signature length range', () => {
        expect(isSignatureValid('')).toBe(false);
        expect(isSignatureValid("',")).toBe(false);
    });
});
