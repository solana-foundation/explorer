import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

// Display-name vocabulary keyed by base58 address — the single wording source for the app's
// registry and @explorer/entity-inspector's fallback resolver. Literal keys have no
// @solana-program/* client dependency in this package.
export const PROGRAM_DISPLAY_NAMES: Readonly<Record<string, string>> = {
    [SYSTEM_PROGRAM_ADDRESS]: 'System Program',
    [TOKEN_PROGRAM_ADDRESS]: 'Token Program',
    [TOKEN_2022_PROGRAM_ADDRESS]: 'Token-2022 Program',
    '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG': 'Solana Attestation Service Program',
    AddressLookupTab1e1111111111111111111111111: 'Address Lookup Table Program',
    BPFLoader1111111111111111111111111111111111: 'BPF Loader',
    BPFLoader2111111111111111111111111111111111: 'BPF Loader 2',
    BPFLoaderUpgradeab1e11111111111111111111111: 'BPF Upgradeable Loader',
    LoaderV411111111111111111111111111111111111: 'Loader v4',
    NativeLoader1111111111111111111111111111111: 'Native Loader',
    Vote111111111111111111111111111111111111111: 'Vote Program',
};
