import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { buildToolCallEvent } from '../analytics-event.js';

function toolResult(structuredContent: Record<string, unknown> | undefined, isError = false): CallToolResult {
    return { content: [], isError, ...(structuredContent ? { structuredContent } : {}) };
}

describe('buildToolCallEvent', () => {
    it('should carry only tool, status, and duration when the result has no structured content', () => {
        expect(buildToolCallEvent('ping', {}, toolResult(undefined), 12)).toEqual({
            name: 'mcp_tool_call',
            params: { duration_ms: 12, status: 'success', tool: 'ping' },
        });
    });

    it('should include the cluster from the tool input and the entity kind from the payload', () => {
        const result = toolResult({ errors: [], payload: { entity: { kind: 'spl-token:mint' } } });

        expect(buildToolCallEvent('inspect_entity', { cluster: 'devnet' }, result, 34)).toEqual({
            name: 'mcp_tool_call',
            params: {
                cluster: 'devnet',
                duration_ms: 34,
                entity_kind: 'spl-token:mint',
                status: 'success',
                tool: 'inspect_entity',
            },
        });
    });

    it('should mark errored results and surface the first error code', () => {
        const result = toolResult({ errors: [{ code: 'INVALID_ARGUMENT', message: 'bad' }], payload: {} }, true);

        expect(buildToolCallEvent('inspect_entity', null, result, 5).params).toMatchObject({
            error_code: 'INVALID_ARGUMENT',
            status: 'error',
        });
    });

    it('should join unique outer and inner decode sources for transactions', () => {
        const result = toolResult({
            errors: [],
            payload: {
                entity: {
                    instructions: [
                        { inner_instructions: [{ source: 'idl' }, { source: 'raw' }], source: 'raw' },
                        { inner_instructions: [], source: 'bundled' },
                        'not-a-record',
                        { inner_instructions: ['not-a-record'] },
                    ],
                    kind: 'transaction',
                },
            },
        });

        expect(buildToolCallEvent('inspect_entity', {}, result, 8).params.decode_sources).toBe('bundled,idl,raw');
    });

    it('should omit decode_sources for a transaction without instructions', () => {
        const result = toolResult({
            errors: [],
            payload: { entity: { instructions: [], kind: 'transaction' } },
        });

        expect(buildToolCallEvent('inspect_entity', {}, result, 8).params).not.toHaveProperty('decode_sources');
    });

    it('should treat a non-array instructions field as no sources', () => {
        const result = toolResult({
            errors: [],
            payload: { entity: { instructions: 'corrupt', kind: 'transaction' } },
        });

        expect(buildToolCallEvent('inspect_entity', {}, result, 8).params).not.toHaveProperty('decode_sources');
    });

    it('should not collect decode sources for non-transaction entities', () => {
        const result = toolResult({
            errors: [],
            payload: { entity: { instructions: [{ source: 'raw' }], kind: 'unknown' } },
        });

        expect(buildToolCallEvent('inspect_entity', {}, result, 8).params).not.toHaveProperty('decode_sources');
    });
});
