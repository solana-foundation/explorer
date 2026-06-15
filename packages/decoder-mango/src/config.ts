import { Config, type GroupConfig } from '@blockworks-foundation/mango-client';
import { type PublicKey } from '@solana/web3.js';

// note: mainnet.1 suffices since its a superset of mainnet.0
export const mangoGroups = Config.ids().groups.filter(group => group.name !== 'mainnet.0');

export function findGroupConfig(programId: PublicKey): GroupConfig | undefined {
    const filtered = mangoGroups.filter(group => group.mangoProgramId.equals(programId));
    if (filtered.length) {
        return filtered[0];
    }
}
