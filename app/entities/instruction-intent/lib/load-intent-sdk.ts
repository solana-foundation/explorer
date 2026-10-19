/** A failed load of the SDK chunk, which a retry can fix, unlike an SDK error on the metadata. */
export class IntentSdkLoadError extends Error {
    readonly name = 'IntentSdkLoadError';

    constructor(options: { cause: unknown }) {
        super('Could not load @codama/dynamic-instructions', options);
    }
}

/** Loads the SDK on demand, so it stays out of the First Load JS of every page with an instruction card. */
export async function loadIntentSdk() {
    try {
        return await import('@codama/dynamic-instructions');
    } catch (error) {
        throw new IntentSdkLoadError({ cause: error });
    }
}
