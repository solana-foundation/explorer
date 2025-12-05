export function invariant(cond: unknown, message?: string): asserts cond is NonNullable<unknown> {
    if (cond === undefined) throw new Error(message ?? 'invariant violated');
}
