import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    BPF_LOADER_2_PROGRAM_ID,
    BPF_LOADER_PROGRAM_ID,
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    LOADER_V4_PROGRAM_ID,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from './constants.js';

// Built-in labels for the programs the package already knows via constants; wording matches the
// explorer's registry so an injected resolver and this fallback never disagree on the same address.
const PROGRAM_LABELS: Record<string, string> = {
    [ADDRESS_LOOKUP_TABLE_PROGRAM_ID]: 'Address Lookup Table Program',
    [BPF_LOADER_2_PROGRAM_ID]: 'BPF Loader 2',
    [BPF_LOADER_PROGRAM_ID]: 'BPF Loader',
    [BPF_UPGRADEABLE_LOADER_PROGRAM_ID]: 'BPF Upgradeable Loader',
    [LOADER_V4_PROGRAM_ID]: 'Loader v4',
    [SOLANA_ATTESTATION_SERVICE_PROGRAM_ID]: 'Solana Attestation Service Program',
    [TOKEN_2022_PROGRAM_ID]: 'Token-2022 Program',
    [TOKEN_PROGRAM_ID]: 'Token Program',
};

export function lookupProgramLabel(address: string): string | undefined {
    return PROGRAM_LABELS[address];
}
