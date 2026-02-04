const DEFAULT_UTL_API_BASE_URL = 'https://token-list-api.solana.cloud';
const DEFAULT_UTL_API_TIMEOUT_MS = 5_000;

export const UTL_API_BASE_URL = process.env.NEXT_PUBLIC_UTL_API_BASE_URL ?? DEFAULT_UTL_API_BASE_URL;

const parsedTimeout = parseInt(process.env.NEXT_PUBLIC_UTL_API_TIMEOUT_MS ?? '', 10);
export const UTL_API_TIMEOUT_MS = Number.isFinite(parsedTimeout) ? parsedTimeout : DEFAULT_UTL_API_TIMEOUT_MS;
