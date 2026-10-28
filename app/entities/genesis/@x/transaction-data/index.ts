// Cross-entity public API (FSD `@x` notation): the slice of the `genesis` entity that the `transaction-data`
// entity may consume. Genesis publishes no on-chain IDL, so its names come from this resolver in the shared
// name-source chain.
export { resolveGenesisInstructionName } from '../../lib/instruction-names';
