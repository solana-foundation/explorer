export type {
    FormattedIdl,
    FieldType,
    StructField,
    InstructionAccountData,
    PdaData,
    ArgField,
    InstructionData,
    NestedInstructionAccountsData,
} from './model/formatters/formatted-idl';
export {
    getIdlSpec,
    getIdlStandard,
    getIdlVersion,
    type AnchorIdl,
    type CodamaIdl,
    type IdlStandard,
    type SupportedIdl,
} from './model/idl-version';
export { isIdlProgramIdMismatch, isInteractiveIdlSupported } from './model/interactive-idl';
export { IdlVariant } from './model/idl-variant';

// Client-side IDL resolver for custom/localhost clusters. Exposed via a lazy loader so `@solana/idl`
// stays code-split out of the program-page bundle (the type re-export below is erased at build time).
export { resolveProgramIdlsClient } from './api/load-resolve-program-idls';
export type { ResolvedClientIdls, ResolveProgramIdlsClientArgs } from './api/load-resolve-program-idls';

// Known-cluster IDL fetch (shared, CDN-cached `/api/idl-latest`). Light — no `@solana/idl` — so a
// plain static export, unlike the client resolver above.
export { fetchProgramIdls } from './api/fetch-program-idls';
export type { FetchedProgramIdls } from './api/fetch-program-idls';

// Per-program instruction-name resolvers built from each program's IDL by discriminator (no Borsh
// decode) — used to label transaction-history rows that the RPC leaves as "Unknown Instruction".
export { useInstructionNameResolvers } from './model/use-instruction-name-resolvers';
export type { InstructionNameResolver } from './model/use-instruction-name-resolvers';

export { getIdlSpecType as getDisplayIdlSpecType } from './model/converters/convert-display-idl';
export { formatDisplayIdl, formatSerdeIdl, getFormattedIdl } from './model/formatters/format';
export { useFormatAnchorIdl } from './model/use-format-anchor-idl';
export { useAnchorProgram } from './model/use-anchor-program';
export { getProvider } from './model/use-idl-from-anchor-program-seed';
export { useFormatCodamaIdl } from './model/use-format-codama-idl';
export { getIdlSpecType } from './model/converters/convert-legacy-idl';
