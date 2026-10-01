import { gen } from '@__fixtures__/gen';
import { parseInstruction } from '@codama/dynamic-parsers';
import { TxInstructionSurface } from '@entities/instruction-card';
import { AccountRole, isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    rootNode,
} from 'codama';
import { describe, expect, it, vi } from 'vitest';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { CodamaInstructionCard } from '../CodamaInstructionCard';

vi.mock('@/app/components/instruction/InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card">
            <div data-testid="instruction-card-title">{title}</div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

vi.mock('@/app/components/instruction/UnknownDetailsCard', () => ({
    UnknownDetailsCard: () => <div data-testid="unknown-card" />,
}));

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) => (
        <div data-testid="address">{overrideText ?? pubkey.toBase58()}</div>
    ),
}));

const PROGRAM = gen.publicKey(0);
const AUTHORITY = gen.address(1);
const VAULT = gen.address(2);

const COUNTER_IDL = rootNode(
    programNode({
        instructions: [
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: true, name: 'authority' })],
                arguments: [
                    instructionArgumentNode({
                        defaultValue: numberValueNode(1),
                        defaultValueStrategy: 'omitted',
                        name: 'discriminator',
                        type: numberTypeNode('u8'),
                    }),
                ],
                discriminators: [fieldDiscriminatorNode('discriminator')],
                name: 'increment',
            }),
        ],
        name: 'counter',
        publicKey: PROGRAM.toBase58(),
    }),
);

describe('CodamaInstructionCard', () => {
    it('should render a titled card with the IDL account names, role badges and argument rows', () => {
        renderCard(
            makeParsedIx({
                accounts: [
                    { address: AUTHORITY, name: 'authority', role: AccountRole.WRITABLE_SIGNER },
                    { address: VAULT, name: 'vaultAccount', role: AccountRole.READONLY },
                ],
                data: { amount: 42, discriminator: 1 },
            }),
        );

        expect(screen.getByTestId('instruction-card-title')).toHaveTextContent('Counter: Increment');
        expect(screen.getByText('Counter')).toBeInTheDocument();

        const authorityRow = screen.getByTestId('account-row-0');
        expect(authorityRow).toHaveTextContent('Authority');
        expect(authorityRow).toHaveTextContent('Writable');
        expect(authorityRow).toHaveTextContent('Signer');
        expect(authorityRow).toHaveTextContent(AUTHORITY);

        const vaultRow = screen.getByTestId('account-row-1');
        expect(vaultRow).toHaveTextContent('VaultAccount');
        expect(vaultRow).not.toHaveTextContent('Writable');
        expect(vaultRow).not.toHaveTextContent('Signer');

        expect(screen.getByText('Argument Name')).toBeInTheDocument();
        expect(screen.getByTestId('ix-args-0-0')).toHaveTextContent('amount');
        expect(screen.getByTestId('ix-args-0-0')).toHaveTextContent('42');
    });

    it('should label an account the IDL leaves unnamed by its position', () => {
        renderCard(
            makeParsedIx({
                accounts: [
                    { address: AUTHORITY, name: 'authority', role: AccountRole.READONLY },
                    { address: VAULT, name: '', role: AccountRole.READONLY },
                ],
            }),
        );

        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Authority');
        expect(screen.getByTestId('account-row-1')).toHaveTextContent('Account #2');
    });

    it('should list an account the IDL does not declare as a remaining account', () => {
        const ix = makeIx([
            { address: AUTHORITY, role: AccountRole.WRITABLE_SIGNER },
            { address: VAULT, role: AccountRole.READONLY },
        ]);

        render(
            <TxInstructionSurface result={{ err: null }}>
                <CodamaInstructionCard
                    ix={ix}
                    index={0}
                    parsedIx={parseInstruction(COUNTER_IDL, toKitInstruction(ix))}
                />
            </TxInstructionSurface>,
        );

        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Authority');
        const remainingRow = screen.getByTestId('account-row-1');
        expect(remainingRow).toHaveTextContent('Remaining Account #1');
        expect(remainingRow).toHaveTextContent(VAULT);
    });

    it('should omit the argument table when the instruction carries a discriminator only', () => {
        renderCard(
            makeParsedIx({
                accounts: [{ address: AUTHORITY, name: 'authority', role: AccountRole.READONLY }],
                data: { discriminator: 7 },
            }),
        );

        expect(screen.getByTestId('account-row-0')).toBeInTheDocument();
        expect(screen.queryByText('Argument Name')).not.toBeInTheDocument();
    });

    it('should omit the account table when the instruction takes no accounts', () => {
        renderCard(makeParsedIx({ accounts: [], data: { amount: 42 } }));

        expect(screen.queryByText('Account Name')).not.toBeInTheDocument();
        expect(screen.getByText('Argument Name')).toBeInTheDocument();
    });

    it('should render a nested address argument as an address', () => {
        const OWNER = gen.address(3);
        renderCard(makeParsedIx({ data: { discriminator: 1, settings: { owner: OWNER } } }));

        fireEvent.click(screen.getByText('Expand'));

        expect(within(screen.getByTestId('ix-args-1-0')).getByTestId('address')).toHaveTextContent(OWNER);
    });

    it('should unmount the nested argument rows when the group collapses', () => {
        renderCard(makeParsedIx({ data: { discriminator: 1, settings: { owner: gen.address(3) } } }));

        fireEvent.click(screen.getByText('Expand'));
        expect(screen.getByTestId('ix-args-1-0')).toHaveTextContent('owner');

        fireEvent.click(screen.getByText('Collapse'));
        expect(screen.queryByTestId('ix-args-1-0')).not.toBeInTheDocument();
        expect(screen.getByText('Expand')).toBeInTheDocument();
    });

    it('should render the Unknown card when the parse does not start at a root node', () => {
        renderCard({
            accounts: [],
            data: {},
            path: [{ kind: 'programNode' }, { kind: 'instructionNode', name: 'increment' }],
        } as never);

        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });

    it('should render the Unknown card when the parse does not end at an instruction node', () => {
        renderCard({
            accounts: [],
            data: {},
            path: [
                { kind: 'rootNode', program: { name: 'counter' } },
                { kind: 'accountNode', name: 'counter' },
            ],
        } as never);

        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });
});

function renderCard(parsedIx: ReturnType<typeof makeParsedIx>) {
    return render(
        <TxInstructionSurface result={{ err: null }}>
            <CodamaInstructionCard ix={makeIx(parsedIx.accounts)} index={0} parsedIx={parsedIx as never} />
        </TxInstructionSurface>,
    );
}

type ParsedAccount = { address: string; name: string; role: AccountRole };

function makeParsedIx({
    accounts = [],
    data = { discriminator: 1 },
    instructionName = 'increment',
}: {
    accounts?: ParsedAccount[];
    data?: Record<string, unknown>;
    instructionName?: string;
}) {
    return {
        accounts,
        data,
        path: [
            { kind: 'rootNode', program: { name: 'counter' } },
            { kind: 'instructionNode', name: instructionName },
        ],
    };
}

function makeIx(accounts: readonly Omit<ParsedAccount, 'name'>[]) {
    return new TransactionInstruction({
        data: Buffer.from([1]),
        keys: accounts.map(({ address, role }) => ({
            isSigner: isSignerRole(role),
            isWritable: isWritableRole(role),
            pubkey: new PublicKey(address),
        })),
        programId: PROGRAM,
    });
}
