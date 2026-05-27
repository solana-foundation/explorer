import { PublicKey, VersionedMessage } from '@solana/web3.js';

const DEFAULT_BLOCKHASH = '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm';

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
