import { describe, expect, it } from 'vitest';

import { loadOgGlows } from '../og-glows';

// `no-restricted-syntax` bans regex literals repo-wide, tests included.
// A data URI is a format, and a prefix check would pass on a truncated one.
// eslint-disable-next-line no-restricted-syntax -- asserting the base64 data URI format
const PNG_DATA_URI = /^data:image\/png;base64,[\w+/]+=*$/;

describe('og-glows images', () => {
    it('should hand back a base64 PNG data URI per status', async () => {
        const glows = await loadOgGlows();

        expect(glows.success).toMatch(PNG_DATA_URI);
        expect(glows.failed).toMatch(PNG_DATA_URI);
    });

    it('should draw the two states from different files', async () => {
        const glows = await loadOgGlows();

        expect(glows.success).not.toBe(glows.failed);
    });
});
