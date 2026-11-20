import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Address } from '@solana/kit';
import type { RootNode } from 'codama';

import { loadIntentSdk } from './load-intent-sdk';

/** Sorted, so one address set maps to one account fetch. */
export async function getAccountsForIntent(root: RootNode, parsed: ParsedInstruction): Promise<Address[]> {
    const { getRequiredAccountsForDisplay } = await loadIntentSdk();
    return [...getRequiredAccountsForDisplay(root, parsed)].sort();
}
