import { gen } from '@__fixtures__/gen';
import { createProgramClient, type ProgramMethodBuilder } from '@codama/dynamic-client';
import { parseInstruction } from '@codama/dynamic-parsers';
import { TxInstructionSurface } from '@entities/instruction-card';
import { AccountRole, isSignerRole, isWritableRole } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
    fieldDiscriminatorNode,
    type InstructionAccountNode,
    instructionAccountNode,
    type InstructionArgumentNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
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
            counterInstruction({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: true, name: 'authority' }),
                    instructionAccountNode({ isSigner: false, isWritable: false, name: 'vaultAccount' }),
                ],
                arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
                discriminator: 1,
                name: 'increment',
            }),
            counterInstruction({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' })],
                discriminator: 2,
                name: 'reset',
            }),
            counterInstruction({
                arguments: [
                    instructionArgumentNode({
                        name: 'settings',
                        type: structTypeNode([structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() })]),
                    }),
                ],
                discriminator: 3,
                name: 'configure',
            }),
        ],
        name: 'counter',
        publicKey: PROGRAM.toBase58(),
    }),
);

const client = createProgramClient(COUNTER_IDL);

describe('CodamaInstructionCard', () => {
    it('should render a titled card with the IDL account names, role badges and argument rows', async () => {
        await renderBuilt(
            client.methods.increment({ amount: 42 }).accounts({ authority: AUTHORITY, vaultAccount: VAULT }),
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

    it('should list an account the IDL does not declare as a remaining account', async () => {
        const ix = toTransactionInstruction(
            await client.methods.reset().accounts({ authority: AUTHORITY }).instruction(),
        );
        ix.keys.push({ isSigner: false, isWritable: false, pubkey: new PublicKey(VAULT) });

        renderInstruction(ix);

        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Authority');
        const remainingRow = screen.getByTestId('account-row-1');
        expect(remainingRow).toHaveTextContent('Remaining Account #1');
        expect(remainingRow).toHaveTextContent(VAULT);
    });

    it('should omit the argument table when the instruction carries a discriminator only', async () => {
        await renderBuilt(client.methods.reset().accounts({ authority: AUTHORITY }));

        expect(screen.getByTestId('account-row-0')).toBeInTheDocument();
        expect(screen.queryByText('Argument Name')).not.toBeInTheDocument();
    });

    it('should omit the account table when the instruction takes no accounts', async () => {
        await renderBuilt(client.methods.configure({ settings: { owner: gen.address(3) } }));

        expect(screen.queryByText('Account Name')).not.toBeInTheDocument();
        expect(screen.getByText('Argument Name')).toBeInTheDocument();
    });

    it('should render a nested address argument as an address', async () => {
        const OWNER = gen.address(3);
        await renderBuilt(client.methods.configure({ settings: { owner: OWNER } }));

        fireEvent.click(screen.getByText('Expand'));

        expect(within(screen.getByTestId('ix-args-1-0')).getByTestId('address')).toHaveTextContent(OWNER);
    });

    it('should unmount the nested argument rows when the group collapses', async () => {
        await renderBuilt(client.methods.configure({ settings: { owner: gen.address(3) } }));

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

async function renderBuilt(builder: ProgramMethodBuilder) {
    return renderInstruction(toTransactionInstruction(await builder.instruction()));
}

function renderInstruction(ix: TransactionInstruction) {
    return render(
        <TxInstructionSurface result={{ err: null }}>
            <CodamaInstructionCard ix={ix} index={0} parsedIx={parseInstruction(COUNTER_IDL, toKitInstruction(ix))} />
        </TxInstructionSurface>,
    );
}

function toTransactionInstruction({
    accounts = [],
    data = new Uint8Array(),
    programAddress,
}: Awaited<ReturnType<ProgramMethodBuilder['instruction']>>) {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: accounts.map(({ address, role }) => ({
            isSigner: isSignerRole(role),
            isWritable: isWritableRole(role),
            pubkey: new PublicKey(address),
        })),
        programId: new PublicKey(programAddress),
    });
}

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

function counterInstruction({
    accounts = [],
    arguments: args = [],
    discriminator,
    name,
}: {
    accounts?: InstructionAccountNode[];
    arguments?: InstructionArgumentNode[];
    discriminator: number;
    name: string;
}) {
    return instructionNode({
        accounts,
        arguments: [
            instructionArgumentNode({
                defaultValue: numberValueNode(discriminator),
                defaultValueStrategy: 'omitted',
                name: 'discriminator',
                type: numberTypeNode('u8'),
            }),
            ...args,
        ],
        discriminators: [fieldDiscriminatorNode('discriminator')],
        name,
    });
}
