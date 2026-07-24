import { z, ZodError } from 'zod';

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

/** Flattens a schema validation failure into a "field: message" summary; undefined when the error is not one. */
export function formatSchemaValidationError(error: unknown): string | undefined {
    if (!(error instanceof ZodError)) {
        return undefined;
    }
    return error.issues
        .map(issue => {
            const field = issue.path.join('.');
            return field ? `${field}: ${issue.message}` : issue.message;
        })
        .join('; ');
}
