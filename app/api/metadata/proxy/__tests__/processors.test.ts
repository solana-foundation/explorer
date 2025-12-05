import { Headers, Response as NodeFetchResponse } from 'node-fetch';
import { describe, expect, it } from 'vitest';

import { processTextAsJson } from '../feature/processors';

function createMockResponse(text: string, headers: Headers = new Headers()): NodeFetchResponse {
    return {
        headers,
        text: async () => text,
    } as unknown as NodeFetchResponse;
}

describe('processTextAsJson', () => {
    it('should parse valid JSON text', async () => {
        const jsonText = '{"name": "Test", "value": 123}';
        const response = createMockResponse(jsonText);

        const result = await processTextAsJson(response);

        expect(result.data).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle JSON with trailing newline', async () => {
        const jsonText = '{"name": "Test"}\n';
        const response = createMockResponse(jsonText);

        const result = await processTextAsJson(response);

        expect(result.data).toEqual({ name: 'Test' });
    });

    it('should handle JSON with leading/trailing whitespace', async () => {
        const jsonText = '  \n{"name": "Test"}\n  ';
        const response = createMockResponse(jsonText);

        const result = await processTextAsJson(response);

        expect(result.data).toEqual({ name: 'Test' });
    });

    it('should handle JSON with newlines and tabs inside (pretty-printed)', async () => {
        const jsonText = `{
\t"name": "World Liberty Financial USD",
\t"symbol": "USD1",
\t"description": "The US Dollar upgraded for a new era of finance.",
\t"image": "https://example.com/logo.png"
}`;
        const response = createMockResponse(jsonText);

        const result = await processTextAsJson(response);

        expect(result.data).toEqual({
            description: 'The US Dollar upgraded for a new era of finance.',
            image: 'https://example.com/logo.png',
            name: 'World Liberty Financial USD',
            symbol: 'USD1',
        });
    });

    it('should handle JSON with CRLF line endings', async () => {
        const jsonText = '{\r\n"name": "Test"\r\n}\r\n';
        const response = createMockResponse(jsonText);

        const result = await processTextAsJson(response);

        expect(result.data).toEqual({ name: 'Test' });
    });

    it('should preserve response headers', async () => {
        const headers = new Headers({
            'Cache-Control': 'max-age=3600',
            'Content-Type': 'text/plain',
        });
        const response = createMockResponse('{"test": true}', headers);

        const result = await processTextAsJson(response);

        expect(result.headers.get('Cache-Control')).toBe('max-age=3600');
        expect(result.headers.get('Content-Type')).toBe('text/plain');
    });

    it('should throw 415 error for invalid JSON', async () => {
        const invalidJson = 'not valid json';
        const response = createMockResponse(invalidJson);

        await expect(processTextAsJson(response)).rejects.toMatchObject({
            status: 415,
        });
    });
});
