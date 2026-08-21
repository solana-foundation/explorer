// Cross-entity public API (FSD `@x` notation): the slice of the `zk-elgamal-proof` entity that the
// `transaction-data` entity is allowed to consume. The program is a builtin with no IDL, so its names
// come from this discriminator resolver in the shared name-source chain.
export { resolveZkElGamalProofName } from '../../lib/instruction';
