// Cross-entity public API (FSD `@x` notation): the slice of the `idl` entity that the
// `program-metadata` entity is allowed to consume. The program-name label reads its first IDL candidate
// from the shared `useProgramIdls` resolution the IDL card and tx decoder also use, so all read one result.
export { useProgramIdls } from '../../model/use-program-idls';
export type { AnchorIdl } from '../../lib/types';
