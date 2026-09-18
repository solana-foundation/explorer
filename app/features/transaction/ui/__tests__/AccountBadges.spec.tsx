import { gen } from '@__fixtures__/gen';
import { ParsedMessage, ParsedMessageAccount, PublicKey } from '@solana/web3.js';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { AccountBadges } from '../AccountBadges';

const PUBKEY = new PublicKey(gen.blockhash(1));

const readonlyAccount: ParsedMessageAccount = {
    pubkey: PUBKEY,
    signer: false,
    source: 'transaction',
    writable: false,
};

const message = { accountKeys: [], addressTableLookups: [], instructions: [] } as unknown as ParsedMessage;

describe('AccountBadges', () => {
    // Both callers wrap this component in a container that collapses with `empty:hidden`, which
    // stops matching as soon as the component emits any node of its own.
    test('should emit no node when no condition matches', () => {
        const { container } = render(
            <AccountBadges index={1} message={message} pubkey={PUBKEY} account={readonlyAccount} />,
        );

        expect(container.childNodes.length).toBe(0);
    });

    test('should emit a node for the fee payer', () => {
        const { container } = render(
            <AccountBadges index={0} message={message} pubkey={PUBKEY} account={readonlyAccount} />,
        );

        expect(container.childNodes.length).toBeGreaterThan(0);
    });
});
