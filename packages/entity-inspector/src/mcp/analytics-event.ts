import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { asRecord, asString } from '../shared/parse-helpers.js';
import type { McpAnalyticsEvent, McpToolCallEventParams } from '../types.js';

// GA4 event-name constraints, mirrored from the app analytics lib (packages can't import from the app):
// every event name must carry the shared `mcp_` prefix and stay within GA4's 40-char limit.
type FitsIn<S extends string, N extends number, Acc extends unknown[] = []> = Acc['length'] extends N
    ? S extends ''
        ? true
        : false
    : S extends `${string}${infer Rest}`
      ? FitsIn<Rest, N, [...Acc, unknown]>
      : true;
type Ga4McpEventName<S extends string> = S extends `mcp_${string}` ? (FitsIn<S, 40> extends true ? S : never) : never;
type McpEventName = McpAnalyticsEvent['name'];
type AssertTrue<T extends true> = T;
// Build fails here if a future event drops the `mcp_` prefix or exceeds GA4's 40-char limit.
export type Ga4EventNamesWithinLimit = AssertTrue<McpEventName extends Ga4McpEventName<McpEventName> ? true : false>;

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
