import { gen } from '@__fixtures__/gen';
import { type AnchorIdl, type CodamaIdl, IdlVariant, type ProgramIdls } from '@entities/idl';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import referenceIdl from '@entities/idl/mocks/anchor/reference-0.29.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { getBase58Decoder } from '@solana/kit';
import {
    type ParsedMessage,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    type VersionedMessage,
} from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { ProgramLogsCardBody } from '../ProgramLogsCardBody';

const idlState: ProgramIdls = { idls: [] };
const useProgramIdls = vi.fn((..._args: unknown[]) => idlState);

vi.mock('@/app/entities/idl/model/use-program-idls', () => ({
    useProgramIdls: (...args: unknown[]) => useProgramIdls(...args),
}));
vi.mock('@utils/program-name', () => ({ ProgramName: () => <span>Program</span> }));
vi.mock('@utils/url', () => ({ useClusterPath: () => '/tx' }));
vi.mock('next/navigation', () => ({ usePathname: () => '/tx' }));

const BASE58_DECODER = getBase58Decoder();
const CODAMA_IDL = codamaIdl as unknown as CodamaIdl;
const UNBUILDABLE_IDL = referenceIdl as unknown as AnchorIdl;
const DEVI = new PublicKey(anchorModernIdl.address);
const CREATE_AMM_CONFIG_IX = new TransactionInstruction({
    data: Buffer.from([137, 52, 237, 212, 215, 117, 108, 104, ...new Array(16).fill(0)]),
    keys: [1, 2, 3].map(index => ({ isSigner: false, isWritable: true, pubkey: gen.publicKey(index) })),
    programId: DEVI,
});

describe('ProgramLogsCardBody', () => {
    beforeEach(() => useProgramIdls.mockClear());

    it('should read the IDLs of the invoked program', () => {
        idlState.idls = [];

        renderLogs();

        expect(useProgramIdls).toHaveBeenCalledWith(DEVI.toBase58(), 'http://localhost', Cluster.Devnet);
    });

    it.each([
        [
            'an Anchor-standard PMP IDL over the Anchor IDL account',
            [
                {
                    idl: renamedIdl('pmp_instruction'),
                    idlAddress: undefined,
                    source: IdlVariant.ProgramMetadata,
                    standard: 'Anchor',
                },
                {
                    idl: renamedIdl('anchor_instruction'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'Pmp Instruction',
        ],
        [
            'the IDL from the Anchor IDL account when the PMP IDL is Codama',
            [
                { idl: CODAMA_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Codama' },
                {
                    idl: renamedIdl('anchor_instruction'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'Anchor Instruction',
        ],
        [
            'the IDL from the Anchor IDL account when the PMP IDL does not build a program',
            [
                { idl: UNBUILDABLE_IDL, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' },
                {
                    idl: renamedIdl('anchor_instruction'),
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'Anchor Instruction',
        ],
        [
            'an Anchor IDL that declares no account types',
            [
                {
                    idl: { ...renamedIdl('stateless_instruction'), accounts: [] },
                    idlAddress: undefined,
                    source: IdlVariant.Anchor,
                    standard: 'Anchor',
                },
            ],
            'Stateless Instruction',
        ],
    ] satisfies [string, NonNullable<ProgramIdls['idls']>, string][])(
        'should name the instruction with %s',
        (_, idls, instructionName) => {
            idlState.idls = idls;

            renderLogs();

            expect(screen.getByText(instructionName, { exact: false })).toBeInTheDocument();
        },
    );

    it('should name the instruction of a jsonParsed message', () => {
        idlState.idls = [
            {
                idl: renamedIdl('parsed_instruction'),
                idlAddress: undefined,
                source: IdlVariant.Anchor,
                standard: 'Anchor',
            },
        ];

        renderLogs(parsedMessage());

        expect(screen.getByText('Parsed Instruction', { exact: false })).toBeInTheDocument();
    });
});

function renamedIdl(name: string): AnchorIdl {
    const [first, ...rest] = anchorModernIdl.instructions;
    return { ...anchorModernIdl, instructions: [{ ...first, name }, ...rest] } as unknown as AnchorIdl;
}

function renderLogs(message: VersionedMessage | ParsedMessage = v0Message()) {
    const logs = [{ computeUnits: 0, failed: false, invokedProgram: DEVI.toBase58(), logs: [], truncated: false }];
    return render(
        <ProgramLogsCardBody message={message} logs={logs} cluster={Cluster.Devnet} url="http://localhost" />,
    );
}

function v0Message(): VersionedMessage {
    return new TransactionMessage({
        instructions: [CREATE_AMM_CONFIG_IX],
        payerKey: gen.publicKey(0),
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

function parsedMessage(): ParsedMessage {
    const { data, keys } = CREATE_AMM_CONFIG_IX;
    return {
        accountKeys: [
            { pubkey: gen.publicKey(0), signer: true, writable: true },
            ...keys.map(({ isSigner, isWritable, pubkey }) => ({ pubkey, signer: isSigner, writable: isWritable })),
            { pubkey: DEVI, signer: false, writable: false },
        ],
        instructions: [
            { accounts: keys.map(({ pubkey }) => pubkey), data: BASE58_DECODER.decode(data), programId: DEVI },
        ],
        recentBlockhash: PublicKey.default.toBase58(),
    };
}
