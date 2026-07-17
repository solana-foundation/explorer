import { z } from 'zod';

// All MCP tool input schemas live here so the validation library is confined to one module.
// @modelcontextprotocol/sdk requires Zod for `inputSchema`, so these stay Zod-based while we're on
// the SDK; swapping to another validator is a change scoped to this file.
// Factories (not module-scope constants) keep importing the package side-effect-free / tree-shakeable.
export function pingInputSchema() {
    return z.object({}).strict().optional().default({});
}
