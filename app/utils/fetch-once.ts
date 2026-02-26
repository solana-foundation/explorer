export async function fetchOnce(key: string, inFlight: Set<string>, fn: () => Promise<void>): Promise<boolean> {
    if (inFlight.has(key)) return false;
    inFlight.add(key);
    try {
        await fn();
        return true;
    } finally {
        inFlight.delete(key);
    }
}
