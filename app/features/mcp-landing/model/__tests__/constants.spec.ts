import { describe, expect, it } from 'vitest';

import { MCP_ENDPOINT_PATH, MCP_ENDPOINT_URL } from '../constants';

describe('mcp-landing constants', () => {
    // Snippets are copied into other people's config files, so a relative or preview-host URL would be useless there.
    it('should expose an absolute endpoint URL ending in the endpoint path', () => {
        expect(MCP_ENDPOINT_URL.startsWith('https://')).toBe(true);
        expect(MCP_ENDPOINT_URL.endsWith(MCP_ENDPOINT_PATH)).toBe(true);
    });
});
