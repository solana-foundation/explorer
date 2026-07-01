import { address } from '@solana/kit';

// Hardcoded Mango v3 program IDs (from Config.ids()) so instruction detection stays free of @blockworks-foundation/mango-client.
export const MANGO_PROGRAM_IDS = {
    devnet: address('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA'),
    mainnet: address('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68'),
    testnet: address('BXhdkETgbHrr5QmVBT1xbz3JrMM28u5djbVtmTUfmFTH'),
};

// Program display name for the app registry; v3 is a dead protocol, so it's marked deprecated.
export const MANGO_V3_PROGRAM_LABEL = 'Mango v3 (deprecated)';
