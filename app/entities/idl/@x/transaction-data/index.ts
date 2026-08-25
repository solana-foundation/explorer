// Cross-entity public API (FSD `@x` notation): the slice of the `idl` entity that `transaction-data` may
// consume. Only its `model/` hooks call the fetch — the name-source chain in `lib/` is handed the
// resolved names and never fetches, so one SWR entry serves every row.
export { useProgramIdlNames } from '../../model/use-program-idl-names';
export { type ProgramIdlNames } from '../../model/instruction-name-table';
