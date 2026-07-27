import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { asRecord, asString } from '../solana/parse-helpers.js';
import type { McpAnalyticsEvent, McpToolCallEventParams } from '../types.js';

// Sources over outer and inner instructions, deduped — 'idl,raw' reads as "partially decoded".
function collectDecodeSources(entity: Record<string, unknown>): string | undefined {
    const instructions = Array.isArray(entity.instructions) ? entity.instructions : [];
    const sources = new Set<string>();
    for (const entry of instructions) {
        const instruction = asRecord(entry);
        const source = asString(instruction?.source);
        if (source) {
            sources.add(source);
        }
        const inner = Array.isArray(instruction?.inner_instructions) ? instruction.inner_instructions : [];
        for (const innerEntry of inner) {
            const innerSource = asString(asRecord(innerEntry)?.source);
            if (innerSource) {
                sources.add(innerSource);
            }
        }
    }
    if (sources.size === 0) {
        return undefined;
    }
    const sorted = [...sources];
    // tsconfig lib is es2020 — no Array#toSorted; the spread above already detaches from the Set.
    // oxlint-disable-next-line unicorn/no-array-sort
    sorted.sort();
    return sorted.join(',');
}

/** Derives the `mcp_tool_call` usage event from a tool's input and result envelope. */
export function buildToolCallEvent(
    tool: string,
    input: unknown,
    result: CallToolResult,
    durationMs: number,
): McpAnalyticsEvent {
    const envelope = asRecord(result.structuredContent);
    const entity = asRecord(asRecord(envelope?.payload)?.entity);
    const entityKind = asString(entity?.kind);
    const errors = Array.isArray(envelope?.errors) ? envelope.errors : [];
    const errorCode = asString(asRecord(errors[0])?.code);
    const cluster = asString(asRecord(input)?.cluster);
    const decodeSources = entity && entityKind === 'transaction' ? collectDecodeSources(entity) : undefined;

    const params: McpToolCallEventParams = {
        duration_ms: durationMs,
        status: result.isError ? 'error' : 'success',
        tool,
        ...(cluster !== null ? { cluster } : {}),
        ...(entityKind !== null ? { entity_kind: entityKind } : {}),
        ...(decodeSources !== undefined ? { decode_sources: decodeSources } : {}),
        ...(errorCode !== null ? { error_code: errorCode } : {}),
    };
    return { name: 'mcp_tool_call', params };
}
