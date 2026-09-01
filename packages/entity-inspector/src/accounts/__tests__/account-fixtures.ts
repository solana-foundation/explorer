import { address, getAddressEncoder } from '@solana/kit';

import { ADDRESS_LOOKUP_TABLE_PROGRAM_ID, BPF_UPGRADEABLE_LOADER_PROGRAM_ID } from '../../shared/constants.js';
import type { AccountProbeEnvelope } from '../../rpc/types.js';
import type { LoaderV4Status } from '../loader-v4-state.js';
import type { NormalizedAccountInfo, NormalizedProgramDataInfo } from '../types.js';

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

/** Legacy-loader program probe: no jsonParsed shape exists, so the RPC serves the account data as raw base64. */
export function legacyLoaderProgramProbe(owner: string, bytes: Uint8Array): AccountProbeEnvelope {
    return {
        value: {
            data: [btoa(String.fromCharCode(...bytes)), 'base64'],
            executable: true,
            lamports: 1141440,
            owner,
        },
    };
}

const LOADER_V4_STATUS_VALUES: Record<LoaderV4Status, bigint> = { deployed: 1n, finalized: 2n, retracted: 0n };

/** LoaderV4State header (slot u64 LE, authority pubkey, status u64 LE) followed by the ELF bytes. */
export function loaderV4StateBytes({
    authority,
    status,
    elf = new Uint8Array([1, 2, 3]),
    slot = 0,
}: {
    authority: string;
    status: LoaderV4Status;
    elf?: Uint8Array;
    slot?: number;
}): Uint8Array {
    const bytes = new Uint8Array(48 + elf.length);
    const view = new DataView(bytes.buffer);
    view.setBigUint64(0, BigInt(slot), true);
    bytes.set(getAddressEncoder().encode(address(authority)), 8);
    view.setBigUint64(40, LOADER_V4_STATUS_VALUES[status], true);
    bytes.set(elf, 48);
    return bytes;
}

type UpgradeableAccountOverrides = {
    address?: string;
    parsedProgram?: string;
    programData?: NormalizedProgramDataInfo;
    programDataAddress?: string | null;
};

/** A normalized upgradeable-program account awaiting its programData enrichment. */
export function upgradeableProgramAccount(overrides: UpgradeableAccountOverrides = {}): NormalizedAccountInfo {
    const base = {
        address: overrides.address,
        owner: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
        parsedData: {
            info: { programData: 'ProgramData111111111111111111111111111111111' },
            type: 'program',
        },
        parsedProgram: overrides.parsedProgram ?? 'bpf-upgradeable-loader',
        programDataAddress:
            overrides.programDataAddress === undefined
                ? 'ProgramData111111111111111111111111111111111'
                : overrides.programDataAddress,
        rawDataBytes: null,
    };
    return overrides.programData
        ? { ...base, programData: overrides.programData, programDataStatus: 'resolved' }
        : { ...base, programDataStatus: 'missing' };
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
