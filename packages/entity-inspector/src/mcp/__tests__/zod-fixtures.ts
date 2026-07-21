import { z, ZodError } from 'zod';

// The only test-side zod import — mirrors the mcp/schemas.ts confinement so specs stay zod-free.

export function fieldIssueValidationError(): ZodError {
    const result = z.object({ id: z.string() }).safeParse({ id: 123 });
    if (result.success) {
        throw new Error('Expected schema parsing to fail for invalid input.');
    }
    return result.error;
}

export function pathlessIssueValidationError(): { error: ZodError; issueMessage: string } {
    const result = z.string().safeParse(1);
    if (result.success) {
        throw new Error('Expected schema parsing to fail for invalid input.');
    }
    return { error: result.error, issueMessage: result.error.issues[0]?.message ?? '' };
}

export function emptyValidationError(): ZodError {
    return new ZodError([]);
}
