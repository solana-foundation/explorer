import { EXPLORER_BASE_URL } from '@utils/env';

export const MCP_ENDPOINT_PATH = '/mcp';

// Snippets always point at the canonical host: a visitor on a preview deployment still wants their agent on production.
export const MCP_ENDPOINT_URL = `${EXPLORER_BASE_URL}${MCP_ENDPOINT_PATH}`;

/** Server key used in every client's config file, so all setup snippets agree. */
export const MCP_SERVER_KEY = 'solana-explorer';
