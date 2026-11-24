import { describe, expect, it, vi } from 'vitest';

import { IntentSdkLoadError, loadIntentSdk } from '../load-intent-sdk';

vi.mock('@codama/dynamic-instructions', () => {
    throw new Error('Failed to fetch dynamically imported module');
});

describe('loadIntentSdk', () => {
    it('should reject with an IntentSdkLoadError when the SDK chunk fails to load', async () => {
        await expect(loadIntentSdk()).rejects.toBeInstanceOf(IntentSdkLoadError);
    });
});
