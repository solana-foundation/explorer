// Cross-entity public API (FSD `@x` notation): the slice of the `transaction-data` entity that the
// `instruction-card` entity is allowed to consume. The transaction surface reads the raw instructions of every version.
export { readRawInstructions } from '../../lib/read-raw-instructions';
