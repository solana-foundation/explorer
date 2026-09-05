/**
 * Returns the array unchanged, or an empty array when it is null/undefined.
 */
export function arrayOrEmpty<T>(items: T[] | null | undefined): T[] {
    return items ?? [];
}
