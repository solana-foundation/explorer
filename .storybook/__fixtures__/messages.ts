import { DEFAULT_BLOCKHASH } from '@__fixtures__/gen';
import { PublicKey, VersionedMessage } from '@solana/web3.js';

export function mockVersionedMessage(overrides: Record<string, unknown> = {}): VersionedMessage {
    return {
        addressTableLookups: [],
        compiledInstructions: [],
        header: {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 0,
            numRequiredSignatures: 1,
        },
        recentBlockhash: DEFAULT_BLOCKHASH,
        staticAccountKeys: [PublicKey.default],
        version: 0,
        ...overrides,
    } as unknown as VersionedMessage;
}
