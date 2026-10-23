import { Idl } from '@coral-xyz/anchor';

import type { IdlFormatter } from './formatted-idl';

export const formatDisplayIdl: IdlFormatter = idl => idl as Idl;
