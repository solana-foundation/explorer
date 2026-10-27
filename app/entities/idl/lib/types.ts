import type { Idl } from '@coral-xyz/anchor';
import type { IdlConst, IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { RootNode } from 'codama';

export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];

/**
 * A pre-0.30 Anchor event: `{ name, fields: [{ name, type }] }`. Codama's `rootNodeFromAnchor` drops
 * these (they don't survive as defined types), so they're stashed on the converted root and rendered
 * from here. The modern `{ name, discriminator }` shape carries no fields and is ignored.
 */
export type LegacyAnchorEvent = { readonly name: string; readonly fields?: ReadonlyArray<LegacyAnchorEventField> };
export type LegacyAnchorEventField = { readonly name: string; readonly type: IdlType };

export type CodamaIdl = RootNode & {
    readonly legacyConstants?: readonly IdlConst[];
    readonly legacyEvents?: readonly LegacyAnchorEvent[];
};
/** An Anchor IDL — the `@coral-xyz/anchor` `Idl`. */
export type AnchorIdl = Idl;
/** Either supported IDL standard. */
export type SupportedIdl = CodamaIdl | AnchorIdl;
/** The IDL standard name. */
export type IdlStandard = 'Anchor' | 'Codama';
