// Cross-entity public API (FSD `@x` notation): the slice of the `lighthouse` entity that the
// `transaction-data` entity is allowed to consume. Lighthouse ships no fetchable IDL, so its names
// come from this discriminator resolver in the shared name-source chain.
export { resolveLighthouseInstructionName } from '../../lib/instruction-names';
