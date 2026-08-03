/**
 * Solana chain ids used by the unified token list (UTL) REST API.
 *
 * These values replace the `ChainId` enum that came from
 * `@solflare-wallet/utl-sdk`. They are part of the UTL request contract, so do
 * not change them.
 */
export enum ChainId {
    MAINNET = 101,
    TESTNET = 102,
    DEVNET = 103,
}
