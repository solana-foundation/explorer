import { identifyLighthouseInstruction, LIGHTHOUSE_PROGRAM_ADDRESS, LighthouseInstruction } from 'lighthouse-sdk';

import { toHex } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

/** Human-readable title for each Lighthouse instruction; also the decoder's parsed `type`. */
export type LighthouseInstructionType =
    | 'Memory Close'
    | 'Memory Write'
    | 'Assert Merkle Tree Account'
    | 'Assert Mint Account'
    | 'Assert Account Data'
    | 'Assert Account Data Multi'
    | 'Assert Token Account'
    | 'Assert Account Delta'
    | 'Assert Account Info'
    | 'Assert Account Info Multi'
    | 'Assert Mint Account Multi'
    | 'Assert Token Account Multi'
    | 'Assert Stake Account'
    | 'Assert Stake Account Multi'
    | 'Assert Upgradeable Loader Account'
    | 'Assert Upgradeable Loader Account Multi'
    | 'Assert Sysvar Clock'
    | 'Assert Bubblegum Tree Config Account';

/**
 * Instruction enum → display title. Single source of truth for Lighthouse instruction names,
 * shared by the decoder (card title) and the transaction-history name resolver below.
 */
export const LIGHTHOUSE_INSTRUCTION_NAMES: Record<LighthouseInstruction, LighthouseInstructionType> = {
    [LighthouseInstruction.MemoryClose]: 'Memory Close',
    [LighthouseInstruction.MemoryWrite]: 'Memory Write',
    [LighthouseInstruction.AssertMerkleTreeAccount]: 'Assert Merkle Tree Account',
    [LighthouseInstruction.AssertMintAccount]: 'Assert Mint Account',
    [LighthouseInstruction.AssertAccountData]: 'Assert Account Data',
    [LighthouseInstruction.AssertAccountDataMulti]: 'Assert Account Data Multi',
    [LighthouseInstruction.AssertTokenAccount]: 'Assert Token Account',
    [LighthouseInstruction.AssertAccountDelta]: 'Assert Account Delta',
    [LighthouseInstruction.AssertAccountInfo]: 'Assert Account Info',
    [LighthouseInstruction.AssertAccountInfoMulti]: 'Assert Account Info Multi',
    [LighthouseInstruction.AssertMintAccountMulti]: 'Assert Mint Account Multi',
    [LighthouseInstruction.AssertTokenAccountMulti]: 'Assert Token Account Multi',
    [LighthouseInstruction.AssertStakeAccount]: 'Assert Stake Account',
    [LighthouseInstruction.AssertStakeAccountMulti]: 'Assert Stake Account Multi',
    [LighthouseInstruction.AssertUpgradeableLoaderAccount]: 'Assert Upgradeable Loader Account',
    [LighthouseInstruction.AssertUpgradeableLoaderAccountMulti]: 'Assert Upgradeable Loader Account Multi',
    [LighthouseInstruction.AssertSysvarClock]: 'Assert Sysvar Clock',
    [LighthouseInstruction.AssertBubblegumTreeConfigAccount]: 'Assert Bubblegum Tree Config Account',
};

/**
 * Resolve a Lighthouse instruction's display name from its program id + the leading instruction bytes,
 * or `undefined` if it isn't a Lighthouse instruction — so it composes with the other resolvers in
 * `NAME_SOURCES`, first hit wins (see the `transaction-data` entity README).
 * Lets transaction-history name Lighthouse rows without the full decode path or an on-chain IDL.
 */
export function resolveLighthouseInstructionName(programId: string, data: Uint8Array): string | undefined {
    if (programId !== LIGHTHOUSE_PROGRAM_ADDRESS) return undefined;
    try {
        return LIGHTHOUSE_INSTRUCTION_NAMES[identifyLighthouseInstruction({ data })];
    } catch (e) {
        // The SDK throws a plain `Error` for an unrecognized discriminator, so this cannot tell that
        // routine miss from a real defect. Logged anyway: an SDK signature change would otherwise leave
        // every Lighthouse row unnamed with no trace. Console only, since the routine miss lands here too.
        Logger.warn('[lighthouse] identify threw; instruction left unnamed', {
            data: toHex(data),
            error: String(e),
        });
        return undefined;
    }
}
