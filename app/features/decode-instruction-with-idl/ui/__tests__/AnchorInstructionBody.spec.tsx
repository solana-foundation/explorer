import { type Idl } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type AnchorInstructionDecoded } from '../../lib/decode-anchor-instruction';
import { AnchorInstructionBody } from '../AnchorInstructionBody';

const ix = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.unique() });

const decoded: AnchorInstructionDecoded = {
    cardTitle: 'Program: Foo',
    decodedIxData: { data: {}, name: 'foo' },
    ixAccounts: [],
    ixDef: { accounts: [], args: [], discriminator: [], name: 'foo' },
    ixName: 'foo',
    programName: 'Program',
};

describe('AnchorInstructionBody', () => {
    it.each(['decodedIxData', 'ixAccounts', 'ixDef'] as const)('should show the failure row without %s', field => {
        render(
            <table>
                <tbody>
                    <AnchorInstructionBody ix={ix} idl={{} as Idl} decoded={{ ...decoded, [field]: undefined }} />
                </tbody>
            </table>,
        );

        expect(
            screen.getByText('Failed to decode account data according to the public Anchor interface'),
        ).toBeInTheDocument();
    });
});
