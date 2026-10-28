import type { Idl } from '@coral-xyz/anchor';
import type { IdlConst, IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { RootNode } from 'codama';

export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];

export type LegacyAnchorEvent = { readonly name: string; readonly fields?: ReadonlyArray<LegacyAnchorEventField> };
export type LegacyAnchorEventField = { readonly name: string; readonly type: IdlType };

export type CodamaIdl = RootNode & {
    readonly legacyConstants?: readonly IdlConst[];
    readonly legacyEvents?: readonly LegacyAnchorEvent[];
    readonly legacyAnchorIdl?: AnchorIdl;
};
export type AnchorIdl = Idl;
export type SupportedIdl = CodamaIdl | AnchorIdl;
export type IdlStandard = 'Anchor' | 'Codama';
