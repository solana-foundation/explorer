import { z } from 'zod';

// Zod confined here: the MCP SDK requires it for inputSchema; a swap-out stays local to this file.
// Factory (not a module-scope const) keeps importing the package side-effect-free for tree-shaking.
export function pingInputSchema() {
    return z.object({}).strict().optional().default({});
}
