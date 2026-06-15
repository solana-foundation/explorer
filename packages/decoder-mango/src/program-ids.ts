import { PublicKey } from '@solana/web3.js';

// Hardcoded Mango v3 program IDs (from Config.ids()) so instruction detection stays free of @blockworks-foundation/mango-client.
export const MANGO_PROGRAM_IDS = {
    devnet: new PublicKey('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA'),
    mainnet: new PublicKey('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68'),
    testnet: new PublicKey('BXhdkETgbHrr5QmVBT1xbz3JrMM28u5djbVtmTUfmFTH'),
};
