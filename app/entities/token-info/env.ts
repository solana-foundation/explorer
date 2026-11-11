const DEFAULT_JUPITER_TOKENS_TIMEOUT_MS = 5_000;

const parsedTimeout = parseInt(process.env.JUPITER_TOKENS_TIMEOUT_MS ?? '', 10);
export const JUPITER_TOKENS_TIMEOUT_MS = Number.isFinite(parsedTimeout)
    ? parsedTimeout
    : DEFAULT_JUPITER_TOKENS_TIMEOUT_MS;
