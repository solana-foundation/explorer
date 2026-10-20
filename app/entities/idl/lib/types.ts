import type { Idl } from '@coral-xyz/anchor';
import type { RootNode } from 'codama';

// Foundational IDL type vocabulary for the slice — thin aliases over the two supported IDL
// representations, with no business logic and no slice-internal dependencies. Lives in `lib` so every
// segment (model, api, ui) can depend on it without an upward import. The version/standard *detection*
// logic that operates on these types lives in `model/idl-version`.

/** Label for an IDL's standard era / format version (see `getIdlVersion`). */
export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];
/** A Codama IDL — the Codama `RootNode`. */
export type CodamaIdl = RootNode;
/** An Anchor IDL — the `@coral-xyz/anchor` `Idl`. */
export type AnchorIdl = Idl;
/** Either supported IDL standard. */
export type SupportedIdl = CodamaIdl | AnchorIdl;
/** The IDL standard name. */
export type IdlStandard = 'Anchor' | 'Codama';
