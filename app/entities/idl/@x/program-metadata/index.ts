// Cross-entity public API (FSD `@x` notation): the slice of the `idl` entity that the
// `program-metadata` entity is allowed to consume. The program-name label selects its PMP IDL from
// the shared `useProgramIdls` resolution the IDL card and tx decoder also use, so all read one result.
export { useProgramIdls } from '../../model/use-program-idls';
