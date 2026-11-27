import type { Account, UpgradeableLoaderAccountData } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { ProgramDataAccountInfo } from '@validators/accounts/upgradeable-program';

export function makeAccount(overrides: Partial<Account> = {}): Account {
    return {
        data: {},
        executable: false,
        lamports: 1_000_000_000,
        owner: PublicKey.default,
        pubkey: PublicKey.default,
        ...overrides,
    };
}

export function makeProgramAccountData(programData?: ProgramDataAccountInfo): UpgradeableLoaderAccountData {
    return {
        parsed: { info: { programData: PublicKey.default }, type: 'program' },
        program: 'bpf-upgradeable-loader',
        programData,
    };
}

export function makeProgramDataInfo(): ProgramDataAccountInfo {
    return { authority: PublicKey.default, data: ['deadbeef', 'base64'], slot: 123 };
}
