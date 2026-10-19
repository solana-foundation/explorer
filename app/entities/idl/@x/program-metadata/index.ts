// Cross-entity public API (FSD `@x` notation): the slice of the `idl` entity that the
// `program-metadata` entity is allowed to consume. The program-name label shares one `useProgramIdls`
// cache entry with every other caller.
export { useProgramIdls } from '../../model/use-program-idls';
export { IdlVariant } from '../../model/idl-variant';
export type { AnchorIdl } from '../../lib/types';
