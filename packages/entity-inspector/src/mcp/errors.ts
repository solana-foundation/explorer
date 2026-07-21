import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { asRecord } from '../solana/parse-helpers.js';
import { formatSchemaValidationError } from './schemas.js';

export const MCP_TOOL_ERROR_CODES = [
    'INVALID_ARGUMENT',
    'NOT_FOUND',
    'CURRENTLY_UNSUPPORTED',
    'INTERNAL_ERROR',
] as const;

export type McpToolErrorCode = (typeof MCP_TOOL_ERROR_CODES)[number];

export type McpToolError = {
    code: McpToolErrorCode;
    message: string;
};

export const DEFAULT_INVALID_ARGUMENT_MESSAGE = 'Invalid tool arguments.';
export const DEFAULT_NOT_FOUND_MESSAGE = 'Requested entity was not found.';
export const DEFAULT_CURRENTLY_UNSUPPORTED_MESSAGE = 'The requested operation is currently unsupported.';
export const DEFAULT_INTERNAL_ERROR_MESSAGE = 'An internal error occurred.';

type ToolResultEnvelope = {
    payload: Record<string, unknown>;
    errors: McpToolError[];
};

export function invalidArgument(message: string = DEFAULT_INVALID_ARGUMENT_MESSAGE): McpToolError {
    return { code: 'INVALID_ARGUMENT', message };
}

export function notFound(message: string = DEFAULT_NOT_FOUND_MESSAGE): McpToolError {
    return { code: 'NOT_FOUND', message };
}

export function currentlyUnsupported(message: string = DEFAULT_CURRENTLY_UNSUPPORTED_MESSAGE): McpToolError {
    return { code: 'CURRENTLY_UNSUPPORTED', message };
}

export function internalError(message: string = DEFAULT_INTERNAL_ERROR_MESSAGE): McpToolError {
    return { code: 'INTERNAL_ERROR', message };
}

function isMcpToolError(value: unknown): value is McpToolError {
    const candidate = asRecord(value);
    if (!candidate) {
        return false;
    }
    return typeof candidate.message === 'string' && MCP_TOOL_ERROR_CODES.some(code => code === candidate.code);
}

export function sanitizeToolError(error: unknown): McpToolError {
    if (isMcpToolError(error)) {
        return error;
    }

    const details = formatSchemaValidationError(error);
    if (details !== undefined) {
        return invalidArgument(details || DEFAULT_INVALID_ARGUMENT_MESSAGE);
    }

    return internalError();
}

// @solana/kit returns BigInt for large numeric fields; BigInt is not JSON-serializable, so coerce to Number (safe) or String (unsafe).
function bigIntReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
        return value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER ? Number(value) : String(value);
    }
    return value;
}

export function toToolResult({
    payload,
    errors,
    isError,
}: {
    payload: Record<string, unknown>;
    errors: McpToolError[];
    isError?: boolean;
}): CallToolResult {
    // Round-trip through JSON so structuredContent and text contain identical coerced values — do not insert logic between these lines.
    // Key order { payload, errors } is part of the wire format — keep parity with the standalone explorer-mcp.
    const text = JSON.stringify({ payload, errors }, bigIntReplacer);
    const envelope: ToolResultEnvelope = JSON.parse(text);

    return {
        content: [
            {
                text,
                type: 'text',
            },
        ],
        isError: isError ?? errors.length > 0,
        structuredContent: envelope,
    };
}
