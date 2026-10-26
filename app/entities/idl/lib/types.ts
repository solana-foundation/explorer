import type { Idl } from '@coral-xyz/anchor';
import type { IdlConst } from '@coral-xyz/anchor/dist/cjs/idl';
import type { RootNode } from 'codama';

export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];
export type CodamaIdl = RootNode & { readonly legacyConstants?: readonly IdlConst[] };
/** An Anchor IDL — the `@coral-xyz/anchor` `Idl`. */
export type AnchorIdl = Idl;
/** Either supported IDL standard. */
export type SupportedIdl = CodamaIdl | AnchorIdl;
/** The IDL standard name. */
export type IdlStandard = 'Anchor' | 'Codama';
