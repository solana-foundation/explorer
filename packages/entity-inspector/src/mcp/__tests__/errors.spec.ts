import { describe, expect, it } from 'vitest';

import {
    currentlyUnsupported,
    DEFAULT_CURRENTLY_UNSUPPORTED_MESSAGE,
    DEFAULT_INTERNAL_ERROR_MESSAGE,
    DEFAULT_INVALID_ARGUMENT_MESSAGE,
    DEFAULT_NOT_FOUND_MESSAGE,
    internalError,
    invalidArgument,
    MCP_TOOL_ERROR_CODES,
    notFound,
    sanitizeToolError,
    toToolResult,
} from '../errors.js';
import { emptyValidationError, fieldIssueValidationError, pathlessIssueValidationError } from './zod-fixtures.js';

describe('MCP error taxonomy', () => {
    it('should define the supported tool error codes', () => {
        expect(MCP_TOOL_ERROR_CODES).toEqual([
            'INVALID_ARGUMENT',
            'NOT_FOUND',
            'CURRENTLY_UNSUPPORTED',
            'INTERNAL_ERROR',
        ]);
    });

    it('should map zod validation errors to INVALID_ARGUMENT', () => {
        expect(sanitizeToolError(fieldIssueValidationError())).toEqual({
            code: 'INVALID_ARGUMENT',
            message: expect.stringContaining('id:'),
        });
    });

    it('should keep the bare zod message when the issue has no path', () => {
        const { error, issueMessage } = pathlessIssueValidationError();

        const sanitized = sanitizeToolError(error);
        expect(sanitized.code).toBe('INVALID_ARGUMENT');
        // No path → the issue message passes through without a "field:" prefix.
        expect(sanitized.message).toBe(issueMessage);
    });

    it('should fall back to the default message for zod errors without issues', () => {
        expect(sanitizeToolError(emptyValidationError())).toEqual({
            code: 'INVALID_ARGUMENT',
            message: DEFAULT_INVALID_ARGUMENT_MESSAGE,
        });
    });

    it('should map unknown runtime errors to INTERNAL_ERROR without leaking internals', () => {
        const sanitized = sanitizeToolError(new Error('db password mismatch'));

        expect(sanitized).toEqual({
            code: 'INTERNAL_ERROR',
            message: DEFAULT_INTERNAL_ERROR_MESSAGE,
        });
        expect(sanitized.message).not.toContain('password');
    });

    it('should support all constructors and pass through canonical tool errors', () => {
        const notFoundError = notFound();
        const unsupportedError = currentlyUnsupported();

        expect(notFoundError).toEqual({ code: 'NOT_FOUND', message: DEFAULT_NOT_FOUND_MESSAGE });
        expect(unsupportedError).toEqual({
            code: 'CURRENTLY_UNSUPPORTED',
            message: DEFAULT_CURRENTLY_UNSUPPORTED_MESSAGE,
        });
        expect(internalError('custom detail')).toEqual({ code: 'INTERNAL_ERROR', message: 'custom detail' });
        expect(sanitizeToolError(notFoundError)).toBe(notFoundError);
    });

    it('should treat non-object unknown values as INTERNAL_ERROR', () => {
        expect(sanitizeToolError(null)).toEqual({
            code: 'INTERNAL_ERROR',
            message: DEFAULT_INTERNAL_ERROR_MESSAGE,
        });
    });

    it('should not pass through error-shaped objects with a bogus code or message', () => {
        expect(sanitizeToolError({ code: 'BOGUS', message: 'x' })).toEqual({
            code: 'INTERNAL_ERROR',
            message: DEFAULT_INTERNAL_ERROR_MESSAGE,
        });
        expect(sanitizeToolError({ code: 'NOT_FOUND', message: 42 })).toEqual({
            code: 'INTERNAL_ERROR',
            message: DEFAULT_INTERNAL_ERROR_MESSAGE,
        });
    });

    it('should build a strict error envelope with code and message only', () => {
        const result = toToolResult({
            errors: [invalidArgument('arguments must be an object with no properties')],
            payload: {},
        });

        expect(result.isError).toBe(true);
        expect(result.structuredContent).toEqual({
            errors: [
                {
                    code: 'INVALID_ARGUMENT',
                    message: 'arguments must be an object with no properties',
                },
            ],
            payload: {},
        });

        const [contentItem] = result.content;
        if (!contentItem || contentItem.type !== 'text') {
            throw new Error('Expected text content in tool error response.');
        }

        const parsedTextEnvelope = JSON.parse(contentItem.text);
        expect(parsedTextEnvelope).toEqual(result.structuredContent);
        expect(new Set(Object.keys(parsedTextEnvelope.errors[0] ?? {}))).toEqual(new Set(['code', 'message']));
    });

    it('should build canonical tool result envelopes for success paths', () => {
        const result = toToolResult({
            errors: [],
            payload: { entity: { kind: 'account' } },
        });

        expect(result.isError).toBe(false);
        expect(result.structuredContent).toEqual({
            errors: [],
            payload: { entity: { kind: 'account' } },
        });
    });

    it('should coerce safe BigInt values to numbers in payload', () => {
        const result = toToolResult({
            errors: [],
            payload: {
                nested: {
                    epoch: BigInt(605),
                    fee: BigInt(0),
                },
            },
        });

        expect(result.structuredContent).toEqual({
            errors: [],
            payload: { nested: { epoch: 605, fee: 0 } },
        });

        const [contentItem] = result.content;
        if (!contentItem || contentItem.type !== 'text') {
            throw new Error('Expected text content in tool result.');
        }
        expect(JSON.parse(contentItem.text)).toEqual(result.structuredContent);
    });

    it('should coerce unsafe BigInt values to strings in payload', () => {
        const result = toToolResult({
            errors: [],
            payload: {
                huge: BigInt('99999999999999999999'),
                hugeNegative: BigInt('-99999999999999999999'),
            },
        });

        expect(result.structuredContent).toEqual({
            errors: [],
            payload: { huge: '99999999999999999999', hugeNegative: '-99999999999999999999' },
        });
    });

    it('should allow isError override to suppress error flag on degraded-but-valid responses', () => {
        const result = toToolResult({
            errors: [internalError('Confirmation status temporarily unavailable.')],
            isError: false,
            payload: { entity: { kind: 'transaction' } },
        });

        expect(result.isError).toBe(false);
    });

    it('should allow isError override to force error flag on empty errors', () => {
        const result = toToolResult({
            errors: [],
            isError: true,
            payload: {},
        });

        expect(result.isError).toBe(true);
    });

    it('should default isError to true when errors are present and override is omitted', () => {
        const result = toToolResult({
            errors: [internalError()],
            payload: {},
        });

        expect(result.isError).toBe(true);
    });
});
