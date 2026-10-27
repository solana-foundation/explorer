import { normalizeAnchorIdl } from '@entities/idl/model/normalize-anchor-idl';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import { type Account } from '@/app/providers/accounts';

import { CodamaAccountCard } from '../CodamaAccountCard';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

// A minimal legacy Anchor IDL converted to the Codama root node the card receives at runtime.
const legacyCounterIdl = {
    accounts: [
        {
            name: 'Counter',
            type: {
                fields: [{ name: 'count', type: 'u64' }],
                kind: 'struct',
            },
        },
    ],
    instructions: [],
    name: 'counter_program',
    version: '0.1.0',
};

const root = normalizeAnchorIdl(legacyCounterIdl, PROGRAM_ADDRESS) as RootNode;

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
}

function counterAccountData(count: bigint): Uint8Array {
    const accountNode = (root as any).program.accounts.find((a: any) => a.name === 'counter');
    const discriminator = hexToBytes(accountNode.data.fields[0].defaultValue.data);
    const countBytes = new Uint8Array(8);
    new DataView(countBytes.buffer).setBigUint64(0, count, true);
    return new Uint8Array([...discriminator, ...countBytes]);
}

function accountWith(raw: Uint8Array | undefined, lamports: number | undefined): Account {
    return {
        data: { raw },
        executable: false,
        lamports,
        owner: new PublicKey(PROGRAM_ADDRESS),
        pubkey: PublicKey.default,
    } as Account;
}

describe('CodamaAccountCard', () => {
    it('should render the decoded rows and a program-qualified title', () => {
        render(<CodamaAccountCard account={accountWith(counterAccountData(42n), 1)} idl={root} />);

        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'CounterProgram: Counter' })).toBeInTheDocument();
        expect(
            screen.queryByText('Failed to decode account data according to the program interface'),
        ).not.toBeInTheDocument();
    });

    it('should render nothing when lamports is undefined', () => {
        const { container } = render(
            <CodamaAccountCard account={accountWith(counterAccountData(42n), undefined)} idl={root} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should show the decode error when the account bytes match no account type', () => {
        const unmatched = new Uint8Array(48); // zeroed discriminator → no match

        render(<CodamaAccountCard account={accountWith(unmatched, 1)} idl={root} />);

        expect(
            screen.getByText('Failed to decode account data according to the program interface'),
        ).toBeInTheDocument();
    });
});
