import { Idl } from '@coral-xyz/anchor';

import type { IdlFormatter } from './formatted-idl';

/**
 * Display formatter for the Anchor IDL card. Only modern Anchor IDLs reach it — legacy IDLs render
 * through the Codama card after `normalizeAnchorIdl` converts them to root nodes. A typed pass-through,
 * kept so the card shares one stable formatter entry point alongside {@link formatSerdeIdl}.
 */
export const formatDisplayIdl: IdlFormatter = idl => idl as Idl;
