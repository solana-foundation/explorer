import { z } from 'zod';

import { SUPPORTED_CLUSTERS } from '../config.js';

// Zod confined here: the MCP SDK requires it for inputSchema; a swap-out stays local to this file.
// Factory (not a module-scope const) keeps importing the package side-effect-free for tree-shaking.
export function pingInputSchema() {
    return z.object({}).strict().optional().default({});
}

export function inspectEntityInputSchema() {
    return z
        .object({
            cluster: z.enum(SUPPORTED_CLUSTERS).optional().default('mainnet-beta'),
            identifier: z.string().min(1).max(128),
        })
        .strict();
}
