import type { KitInstruction } from '@explorer/parsers';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import { MINT, mintToInstruction, SYSTEM_ROOT, TOKEN_ROOT, transferSolInstruction } from '../../mocks/fixtures';
import { getAccountsForIntent } from '../get-accounts-for-intent';
import { checkInstructionIntentExists } from '../intent';

function parse(root: RootNode, instruction: KitInstruction) {
    const ixIntentExist = checkInstructionIntentExists(root, instruction);
    if (ixIntentExist.status !== 'exists') throw new Error('The fixture has no intent');
    return ixIntentExist.parsed;
}

describe('getAccountsForIntent', () => {
    it('should plan no accounts when the amount needs none', async () => {
        await expect(getAccountsForIntent(SYSTEM_ROOT, parse(SYSTEM_ROOT, transferSolInstruction()))).resolves.toEqual(
            [],
        );
    });

    it('should plan the mint when the amount needs its decimals', async () => {
        await expect(getAccountsForIntent(TOKEN_ROOT, parse(TOKEN_ROOT, mintToInstruction()))).resolves.toEqual([MINT]);
    });
});
