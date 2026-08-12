import { EXPLORER_BASE_URL } from '@utils/env';

export const MCP_ENDPOINT_PATH = '/mcp';

// Snippets always point at the canonical host: a visitor on a preview deployment still wants their agent on production.
export const MCP_ENDPOINT_URL = `${EXPLORER_BASE_URL}${MCP_ENDPOINT_PATH}`;

/** Server key used in every client's config file, so all setup snippets agree. */
export const MCP_SERVER_KEY = 'solana-explorer';

export const MCP_SERVER_NAME = 'explorer-mcp';

// Deliberate subset of SUPPORTED_CLUSTERS in @explorer/entity-inspector: simd296 is queryable but not
// advertised yet. Restated here so a client bundle never pulls the MCP runtime barrel; a spec keeps it honest.
export const MCP_SUPPORTED_CLUSTERS: readonly string[] = ['mainnet-beta', 'devnet', 'testnet'];
