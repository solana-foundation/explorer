import { type Address } from '@solana/kit';

import { type TaggedIdl } from '../../lib/types';

export type IdlSelection = 'custom' | 'onChain';

declare const parsed: unique symbol;

export type CustomIdl = TaggedIdl & { readonly programAddress: Address; readonly [parsed]: true };

export type CustomIdlOrigin = { kind: 'file'; fileName: string } | { kind: 'pasted' };

export type CustomIdlRecord = { customIdl: CustomIdl; origin: CustomIdlOrigin; selected: IdlSelection };
