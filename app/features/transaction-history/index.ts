export { TransactionHistoryCard } from './ui/TransactionHistoryCard';

// Type-only re-exports are erased at build time, so exposing the feature's public types here carries
// no bundle cost and gives consumers a stable entry point (no reaching into lib/ internals).
export type { AccountHistory } from './lib/types';
