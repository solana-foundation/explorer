import { gen } from '@__fixtures__/gen';
import { type AnchorIdl, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { ProgramLogsCardBody } from '../ProgramLogsCardBody';

const idlState: Pick<ProgramIdls, 'candidates'> = { candidates: [] };

vi.mock('@entities/idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/idl')>()),
    useProgramIdls: () => idlState,
}));
vi.mock('@utils/program-name', () => ({ ProgramName: () => <span>Program</span> }));
vi.mock('@utils/url', () => ({ useClusterPath: () => '/tx' }));
vi.mock('next/navigation', () => ({ usePathname: () => '/tx' }));

const DEVI = new PublicKey(anchorModernIdl.address);
const CREATE_AMM_CONFIG_IX = new TransactionInstruction({
    data: Buffer.from([137, 52, 237, 212, 215, 117, 108, 104, ...new Array(16).fill(0)]),
    keys: [1, 2, 3].map(index => ({ isSigner: false, isWritable: true, pubkey: gen.publicKey(index) })),
    programId: DEVI,
});

describe('ProgramLogsCardBody', () => {
    it.each([
        [
            'an Anchor-standard PMP IDL before the Anchor IDL account',
            [
                {
                    address: undefined,
                    idl: renamedIdl('pmp_instruction'),
                    source: 'programMetadata',
                    standard: 'Anchor',
                },
                { address: undefined, idl: renamedIdl('anchor_instruction'), source: 'anchor', standard: 'Anchor' },
            ],
            'Pmp Instruction',
        ],
        [
            'a selected custom Anchor IDL',
            [
                {
                    idl: renamedIdl('custom_instruction'),
                    origin: { kind: 'pasted' },
                    source: 'custom',
                    standard: 'Anchor',
                },
            ],
            'Custom Instruction',
        ],
    ] satisfies [string, NonNullable<ProgramIdls['candidates']>, string][])(
        'should name the instruction with %s',
        (_, candidates, instructionName) => {
            idlState.candidates = candidates;

            renderLogs();

            expect(screen.getByText(instructionName, { exact: false })).toBeInTheDocument();
        },
    );
});

function renamedIdl(name: string): AnchorIdl {
    const [first, ...rest] = anchorModernIdl.instructions;
    return { ...anchorModernIdl, instructions: [{ ...first, name }, ...rest] } as unknown as AnchorIdl;
}

function renderLogs() {
    const message = new TransactionMessage({
        instructions: [CREATE_AMM_CONFIG_IX],
        payerKey: gen.publicKey(0),
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
    const logs = [{ computeUnits: 0, failed: false, invokedProgram: DEVI.toBase58(), logs: [], truncated: false }];
    return render(
        <ProgramLogsCardBody message={message} logs={logs} cluster={Cluster.Devnet} url="http://localhost" />,
    );
}
