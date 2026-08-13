import { describe, expect, it } from 'vitest';

import { MCP_ENDPOINT_URL, MCP_SERVER_KEY } from '../constants';
import { MCP_SETUP_CLIENTS } from '../setup-clients';

const snippets = MCP_SETUP_CLIENTS.flatMap(client => client.steps.flatMap(step => step.snippet ?? []));

describe('MCP_SETUP_CLIENTS', () => {
    it('should cover every supported client', () => {
        expect(MCP_SETUP_CLIENTS.map(client => client.label)).toEqual([
            'Claude Code',
            'Cursor',
            'VS Code',
            'Codex',
            'Windsurf',
        ]);
    });

    it('should give every client a unique id', () => {
        const ids = MCP_SETUP_CLIENTS.map(client => client.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('should give every client at least one snippet to copy', () => {
        for (const client of MCP_SETUP_CLIENTS) {
            expect(
                client.steps.some(step => step.snippet),
                client.id,
            ).toBe(true);
        }
    });

    it('should point every snippet at the canonical endpoint', () => {
        for (const snippet of snippets) {
            expect(snippet.code, snippet.caption).toContain(MCP_ENDPOINT_URL);
        }
    });

    it('should register every snippet under the shared server key', () => {
        for (const snippet of snippets) {
            expect(snippet.code, snippet.caption).toContain(MCP_SERVER_KEY);
        }
    });

    // Production deliberately runs without MCP_ACCESS_KEYS; the operator README snippets do carry a Bearer header,
    // so guard against a copy-paste of those.
    it('should not present any authentication header', () => {
        for (const snippet of snippets) {
            const code = snippet.code.toLowerCase();
            expect(code, snippet.caption).not.toContain('authorization');
            expect(code, snippet.caption).not.toContain('bearer');
        }
    });
});
