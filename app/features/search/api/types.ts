export type DiscoveredToken = {
    address: string;
    decimals: number | undefined;
    isVerified: boolean;
    logoUri: string | undefined;
    name: string;
    symbol: string;
};

// `ok: false` signals any non-success (unconfigured, HTTP error, schema mismatch, network, abort)
// — the caller may fall back to another source using whatever signal budget remains.
export type DiscoveryResult = {
    ok: boolean;
    tokens: DiscoveredToken[];
};
