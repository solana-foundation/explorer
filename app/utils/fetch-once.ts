export async function fetchOnce(key: string, inFlight: Set<string>, fn: () => Promise<void>) {
    if (inFlight.has(key)) return;
    inFlight.add(key);
    try {
        await fn();
    } finally {
        inFlight.delete(key);
    }
}
