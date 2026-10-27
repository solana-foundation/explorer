import { gen } from '@__fixtures__/gen';
import { inspectorSurface } from '@components/inspector/inspector-surface';
import { type InstructionNode, InstructionSurfaceProvider, toInstructionNode } from '@entities/instruction-card';
import { InstructionParserProvider } from '@entities/instruction-parser';
import { IdlInstructionCard, useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import {
    BPF_LOADER_PROGRAM_ID,
    type ParsedInstruction,
    PublicKey,
    StakeProgram,
    SystemProgram,
    TransactionInstruction,
    VoteProgram,
} from '@solana/web3.js';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderTxCard, renderWithProviders } from '@/app/__tests__/card-harness';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionNodeCard } from '../InstructionNodeCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    IdlInstructionCard: vi.fn(() => <div>IDL card</div>),
    useIdlInstructionDecode: vi.fn(),
}));

vi.mock('@features/decode-instruction-memo', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-memo')>()),
    MemoDetailsCard: () => {
        throw new Error('memo card failed');
    },
}));

const [FROM, TO] = [gen.publicKey(1), gen.publicKey(2)];
const TRANSFER = SystemProgram.transfer({ fromPubkey: FROM, lamports: 1, toPubkey: TO });
const ED25519_PROGRAM_ID = new PublicKey('Ed25519SigVerify111111111111111111111111111');
const FOREIGN_PROGRAM = gen.publicKey(9);
const BPF_UPGRADEABLE_LOADER_PROGRAM_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const SAS_PROGRAM_ID = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
const MEMO = new TransactionInstruction({
    data: Buffer.from('hello'),
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
});

describe('InstructionNodeCard', () => {
    beforeEach(() => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should route an RPC-parsed instruction by the program the RPC names', () => {
        const parsed: ParsedInstruction = {
            parsed: { info: { destination: TO.toBase58(), lamports: 1, source: FROM.toBase58() }, type: 'transfer' },
            program: 'system',
            programId: SystemProgram.programId,
        };

        renderCard(toInstructionNode({ index: 0, ix: parsed }));

        expect(screen.getByText('System Program: Transfer')).toBeInTheDocument();
    });

    it('should route an instruction in byte form through its parser slice', () => {
        renderCard(toInstructionNode({ index: 0, ix: TRANSFER }));

        expect(screen.getByText('System Program: Transfer')).toBeInTheDocument();
    });

    it('should show the decoded payload and the bytes of an instruction in byte form in the Raw view', async () => {
        renderCard(toInstructionNode({ index: 0, ix: TRANSFER }));

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(screen.getByText('(JSON)')).toBeInTheDocument();
        expect(screen.getByText('(Hex)')).toBeInTheDocument();
    });

    it('should prefer the card of the program over a card that an IDL decodes', () => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'anchor' } as never);

        renderCard(toInstructionNode({ index: 0, ix: TRANSFER }));

        expect(screen.getByText('System Program: Transfer')).toBeInTheDocument();
        expect(IdlInstructionCard).not.toHaveBeenCalled();
    });

    it('should hand an instruction that the parser slice rejects to the IDL card', () => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'anchor' } as never);
        const unknown = new TransactionInstruction({
            data: Buffer.from([255, 0, 0, 0]),
            keys: [],
            programId: SystemProgram.programId,
        });

        renderCard(toInstructionNode({ index: 0, ix: unknown }));

        expect(screen.getByText('IDL card')).toBeInTheDocument();
    });

    it('should show the unknown card for a program with no card and no IDL', () => {
        const foreign = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: FOREIGN_PROGRAM });

        renderCard(toInstructionNode({ index: 0, ix: foreign }));

        expect(
            screen.getByText(`Unknown Program (${FOREIGN_PROGRAM.toBase58()}): Unknown Instruction`),
        ).toBeInTheDocument();
    });

    it('should route the bytes of a stake instruction, which has no parser slice', () => {
        const getMinimumDelegation = new TransactionInstruction({
            data: Buffer.from([13, 0, 0, 0]),
            keys: [],
            programId: StakeProgram.programId,
        });

        renderCard(toInstructionNode({ index: 0, ix: getMinimumDelegation }));

        expect(screen.getByText('Stake Program: Get Minimum Delegation')).toBeInTheDocument();
    });

    it('should hand the bytes of a stake instruction that its card cannot decode to the IDL card', () => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'anchor' } as never);
        const delegate = StakeProgram.delegate({
            authorizedPubkey: FROM,
            stakePubkey: TO,
            votePubkey: FOREIGN_PROGRAM,
        });

        renderCard(toInstructionNode({ index: 0, ix: delegate.instructions[0] }));

        expect(screen.getByText('IDL card')).toBeInTheDocument();
    });

    it.each([
        ['Token', TOKEN_PROGRAM_ID],
        ['Token-2022', TOKEN_2022_PROGRAM_ID],
    ])('should route a %s batch, which the Token parser slice rejects, to the batch card', (_, programId) => {
        const batch = new TransactionInstruction({ data: Buffer.from([255, 0]), keys: [], programId });

        renderCard(toInstructionNode({ index: 0, ix: batch }));

        expect(screen.getByText('Token Program: Batch (0 instructions)')).toBeInTheDocument();
    });

    it.each([
        [
            'an RPC-parsed stake instruction',
            rpcParsed(StakeProgram.programId, 'stake', 'deactivate', { stakeAccount: FROM, stakeAuthority: TO }),
            'Stake Program: Deactivate Stake',
        ],
        [
            'an RPC-parsed vote instruction',
            rpcParsed(VoteProgram.programId, 'vote', 'updateValidatorIdentity', {
                newValidatorIdentity: FROM,
                voteAccount: TO,
                withdrawAuthority: FROM,
            }),
            'Vote: Update Validator Identity',
        ],
        [
            'a BPF Loader instruction in byte form',
            byteForm(BPF_LOADER_PROGRAM_ID, [1, 0, 0, 0], 2),
            'BPF Loader 2: Finalize',
        ],
        [
            'a BPF Upgradeable Loader instruction in byte form',
            byteForm(BPF_UPGRADEABLE_LOADER_PROGRAM_ID, [5, 0, 0, 0], 3),
            'BPF Upgradeable Loader: Close',
        ],
        [
            'a Solana Attestation instruction in byte form',
            byteForm(SAS_PROGRAM_ID, [2, 1], 3),
            'Solana Attestation: Change Schema Status',
        ],
    ])('should route %s to the card of its program', (_, ix, title) => {
        renderCard(toInstructionNode({ index: 0, ix }));

        expect(screen.getByText(title)).toBeInTheDocument();
    });

    it('should route a batch that the RPC parses to the batch card', () => {
        const batch: ParsedInstruction = {
            parsed: { info: { instructions: [] }, type: 'batch' },
            program: 'spl-token',
            programId: TOKEN_PROGRAM_ID,
        };

        renderCard(toInstructionNode({ index: 0, ix: batch }));

        expect(screen.getByText('Token Program: Batch (0 instructions)')).toBeInTheDocument();
    });

    it('should render the card of a new instruction at a position whose previous card threw', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { rerender } = renderCard(toInstructionNode({ index: 0, ix: MEMO }));
        expect(screen.getByText('Unknown Instruction', { exact: false })).toBeInTheDocument();

        rerender(routed(toInstructionNode({ index: 0, ix: TRANSFER })));

        expect(screen.getByText('System Program: Transfer')).toBeInTheDocument();
        consoleError.mockRestore();
    });

    it('should resolve ed25519 offsets against the instruction data of the surface', () => {
        const signatureInInstruction1 = new Uint8Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
        const ed25519 = new TransactionInstruction({
            data: Buffer.from(signatureInInstruction1),
            keys: [],
            programId: ED25519_PROGRAM_ID,
        });
        const instructionData = (index: number) => (index === 1 ? new Uint8Array(96).fill(7) : undefined);

        renderWithProviders(
            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                <InstructionSurfaceProvider surface={inspectorSurface(instructionData)}>
                    <InstructionNodeCard node={toInstructionNode({ index: 0, ix: ed25519 })} />
                </InstructionSurfaceProvider>
            </InstructionParserProvider>,
        );

        expect(screen.getByText('Ed25519: Verify Signature')).toBeInTheDocument();
        expect(screen.queryByText('Invalid reference')).not.toBeInTheDocument();
    });
});

function renderCard(node: InstructionNode) {
    return renderTxCard(routed(node));
}

function routed(node: InstructionNode) {
    return (
        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
            <InstructionNodeCard node={node} />
        </InstructionParserProvider>
    );
}

function rpcParsed(programId: PublicKey, program: string, type: string, info: Record<string, PublicKey>) {
    const base58 = Object.fromEntries(Object.entries(info).map(([key, pubkey]) => [key, pubkey.toBase58()]));
    return { parsed: { info: base58, type }, program, programId } satisfies ParsedInstruction;
}

function byteForm(programId: PublicKey, data: number[], accountCount: number) {
    const keys = [1, 2, 3].slice(0, accountCount).map(seed => ({
        isSigner: false,
        isWritable: false,
        pubkey: gen.publicKey(seed),
    }));
    return new TransactionInstruction({ data: Buffer.from(data), keys, programId });
}
