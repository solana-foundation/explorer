// UI only, on purpose. Re-exporting the data layer here would pull TransactionHistoryCard
// and its whole render tree into every route that only wants a hook — measured at +30 kB
// first-load on /address/[address]/{instructions,tokens,transfers} (see bench/BUILD.md).
// Consumers of the provider, hooks and filter types deep-import from model/ and lib/.
export { TransactionHistoryCard } from './ui/TransactionHistoryCard';
