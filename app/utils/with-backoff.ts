type BackoffOptions = {
    maxRetries?: number;
    initialDelay?: number;
    factor?: number;
};

export function withBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions): Promise<T> {
    const { maxRetries = 5, initialDelay = 300, factor = 2 } = options ?? {};

    async function attempt(retries: number, delay: number): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) throw error;
            console.debug(`[withBackoff] Retrying in ${delay}ms (${retries} retries left)`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attempt(retries - 1, delay * factor);
        }
    }

    return attempt(maxRetries, initialDelay);
}
