import { ADDRESS_LOOKUP_TABLE_PROGRAM_ID, BPF_UPGRADEABLE_LOADER_PROGRAM_ID } from '../constants.js';
import type { AccountProbeEnvelope, NormalizedAccountInfo } from '../types.js';

// Constructors for account fixtures (RPC probe envelopes + normalized accounts) so specs assert behavior instead of hand-building raw shapes.

export function notFoundAccountProbe(): AccountProbeEnvelope {
    return { value: null };
}

type ParsedAccountProbeInit = {
    program: string;
    parsed: unknown;
    owner: string;
    executable?: boolean;
    lamports?: number | bigint;
};

export function parsedAccountProbe({
    program,
    parsed,
    owner,
    executable = false,
    lamports = 0,
}: ParsedAccountProbeInit): AccountProbeEnvelope {
    return {
        value: {
            data: { parsed, program },
            executable,
            lamports,
            owner,
        },
    };
}

export function rawAccountProbe({
    bytes,
    owner,
    lamports = 0,
}: {
    bytes: Uint8Array;
    owner: string;
    lamports?: number | bigint;
}): AccountProbeEnvelope {
    return {
        value: {
            data: [btoa(String.fromCharCode(...bytes)), 'base64'],
            executable: false,
            lamports,
            owner,
        },
    };
}

/** First probe of an upgradeable program: jsonParsed `program` info pointing at its programData account. */
export function upgradeableProgramProbe(programDataAddress: string): AccountProbeEnvelope {
    return parsedAccountProbe({
        executable: true,
        lamports: 567591537,
        owner: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
        parsed: { info: { programData: programDataAddress }, type: 'program' },
        program: 'bpf-upgradeable-loader',
    });
}

/** Second probe: the programData account with authority/slot and raw executable bytes. */
export function upgradeableProgramDataProbe({
    authority,
    slot,
    dataBase64 = btoa(String.fromCharCode(0)),
}: {
    authority: string | null;
    slot: number;
    dataBase64?: string;
}): AccountProbeEnvelope {
    return parsedAccountProbe({
        owner: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
        parsed: {
            info: { authority, data: [dataBase64, 'base64'], slot },
            type: 'programData',
        },
        program: 'bpf-upgradeable-loader',
    });
}

/** A normalized upgradeable-program account awaiting its programData enrichment. */
export function upgradeableProgramAccount(overrides?: Partial<NormalizedAccountInfo>): NormalizedAccountInfo {
    return {
        owner: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
        parsedData: {
            info: { programData: 'ProgramData111111111111111111111111111111111' },
            type: 'program',
        },
        parsedProgram: 'bpf-upgradeable-loader',
        programData: null,
        programDataAddress: 'ProgramData111111111111111111111111111111111',
        programDataStatus: 'missing',
        rawDataBytes: null,
        ...overrides,
    };
}

export function unknownProgramAccountProbe(): AccountProbeEnvelope {
    return parsedAccountProbe({ owner: 'UnknownOwner', parsed: { type: 'other' }, program: 'unknown-program' });
}

export function addressLookupTableRawProbe(): AccountProbeEnvelope {
    return rawAccountProbe({ bytes: new Uint8Array(56), owner: ADDRESS_LOOKUP_TABLE_PROGRAM_ID });
}

export function compressedNftDasAsset(): unknown {
    return {
        compression: { compressed: true, tree: 'tree-id' },
        id: 'asset-id',
        ownership: { owner: 'owner-id' },
    };
}
