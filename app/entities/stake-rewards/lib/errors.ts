/**
 * Carries the upstream status so the route can distinguish a rate limit from a hard failure.
 *
 * `status` rides in the options bag rather than in `cause`, so `cause` keeps its standard
 * Error-chaining semantics and reporters can still walk the chain.
 */
export class SolscanRequestError extends Error {
    readonly status: number;

    constructor(message: string, options: ErrorOptions & { status: number }) {
        super(message, options);
        this.name = 'SolscanRequestError';
        this.status = options.status;
    }
}

/**
 * Solscan answered, but the body carries nothing we can sum — `success: false`, a missing `data`,
 * or a shape their contract no longer matches.
 *
 * Separate from our own invariant failures (the paging bound, the safe-integer guard) because the
 * two need different owners: this one is theirs to explain and ours to re-read, and until someone
 * does, every stake account's Total Reward row quietly reads `Unavailable`.
 */
export class SolscanResponseError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'SolscanResponseError';
    }
}
