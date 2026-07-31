// Addresses for which getTransactionsForAddress is temporarily disabled. gTFA on these
// hot accounts is currently timing out on the Triton side and driving up ClickHouse CPU
// (a "death call"), so we skip gTFA and go straight to the getSignaturesForAddress
// fallback until Triton confirms the issue is mitigated. Remove entries here once cleared.
// See: Triton report re: Superbank gTFA on wrapped SOL.
const GTFA_DISABLED_ADDRESSES = new Set<string>([
    'So11111111111111111111111111111111111111112', // wrapped SOL
]);

export function isGtfaDisabled(address: string): boolean {
    return GTFA_DISABLED_ADDRESSES.has(address);
}
