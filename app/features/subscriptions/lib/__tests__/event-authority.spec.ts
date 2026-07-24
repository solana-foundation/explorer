import { describe, expect, it } from 'vitest';

import { deriveEventAuthorityAddress } from '../event-authority';

describe('deriveEventAuthorityAddress', () => {
    it('should derive the known Subscriptions event-authority PDA', async () => {
        // Derivation is deterministic (local PDA crypto, no network) for the program address.
        expect(await deriveEventAuthorityAddress()).toBe('3Hnj4BYoDgtpBuqXfiy7Y8cNa3jXaNd4oqgSXBzkMcH7');
    });
});
