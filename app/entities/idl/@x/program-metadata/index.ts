// Cross-entity public API (FSD `@x` notation): the slice of the `idl` entity that the
// `program-metadata` entity is allowed to consume. The program-name label resolves the PMP IDL
// through the same idl-entity fetchers the IDL card uses, so both read one resolution.
export { fetchProgramIdls } from '../../api/fetch-program-idls';
export type { FetchedProgramIdls } from '../../api/fetch-program-idls';
export { resolveProgramIdlsClient } from '../../api/load-resolve-program-idls';
export type { ResolvedClientIdls, ResolveProgramIdlsClientArgs } from '../../api/load-resolve-program-idls';
