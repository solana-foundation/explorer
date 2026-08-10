/**
 * Read at the call site rather than at module scope. A module-scope read freezes the value at
 * import time, which breaks `vi.stubEnv` in tests and per-environment config on the server.
 */
export const getSolscanApiKey = () => process.env.SOLSCAN_API;
