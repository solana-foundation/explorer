import type { KitInstruction } from '@explorer/parsers';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import {
    DESTINATION,
    MINT,
    mintAccount,
    mintToInstruction,
    missingAccount,
    SOURCE,
    SYSTEM_ROOT,
    TOKEN_ROOT,
    transferSolInstruction,
} from '../../mocks/fixtures';
import { computeInstructionIntent } from '../compute-instruction-intent';
import { checkInstructionIntentExists } from '../intent';

function parse(root: RootNode, instruction: KitInstruction) {
    const ixIntentExist = checkInstructionIntentExists(root, instruction);
    if (ixIntentExist.status !== 'exists') throw new Error('The fixture has no intent');
    return ixIntentExist.parsed;
}

describe('computeInstructionIntent', () => {
    it('should split the sentence into text and address parts when the template has addresses', async () => {
        const intent = await computeInstructionIntent({
            accounts: [],
            parsed: parse(SYSTEM_ROOT, transferSolInstruction()),
            root: SYSTEM_ROOT,
        });

        expect(intent).toEqual({
            fields: [
                { label: 'Amount', value: '1.5 SOL' },
                { label: 'From', value: SOURCE },
                { label: 'To', value: DESTINATION },
            ],
            interpolated: true,
            sentenceParts: [
                { kind: 'text', text: 'Transfer 1.5 SOL from ' },
                { address: SOURCE, kind: 'address' },
                { kind: 'text', text: ' to ' },
                { address: DESTINATION, kind: 'address' },
            ],
            usedAccountData: false,
        });
    });

    it('should scale the minted amount when the account list holds the mint', async () => {
        const intent = await computeInstructionIntent({
            accounts: [mintAccount(6)],
            parsed: parse(TOKEN_ROOT, mintToInstruction()),
            root: TOKEN_ROOT,
        });

        expect(intent.interpolated).toBe(true);
        expect(intent.usedAccountData).toBe(true);
        expect(intent.sentenceParts).toEqual([
            { kind: 'text', text: 'Mint 1.5 ' },
            { address: MINT, kind: 'address' },
            { kind: 'text', text: ' to ' },
            { address: DESTINATION, kind: 'address' },
        ]);
    });

    it('should fall back to the short label when the mint account is missing', async () => {
        const intent = await computeInstructionIntent({
            accounts: [missingAccount(MINT)],
            parsed: parse(TOKEN_ROOT, mintToInstruction()),
            root: TOKEN_ROOT,
        });

        expect(intent.interpolated).toBe(false);
        expect(intent.usedAccountData).toBe(false);
        expect(intent.sentenceParts).toEqual([{ kind: 'text', text: 'Mint tokens' }]);
        expect(intent.fields[0]).toEqual({ label: 'Amount', value: '1500000 (raw)' });
    });

    it('should not report account data when the sentence is withheld', async () => {
        const intent = await computeInstructionIntent({
            accounts: [missingAccount(MINT), mintAccount(6, DESTINATION)],
            parsed: parse(TOKEN_ROOT, mintToInstruction()),
            root: TOKEN_ROOT,
        });

        expect(intent.interpolated).toBe(false);
        expect(intent.usedAccountData).toBe(false);
    });
});
