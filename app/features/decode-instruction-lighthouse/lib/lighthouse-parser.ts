import { LIGHTHOUSE_INSTRUCTION_NAMES } from '@entities/lighthouse';
import type { AccountMeta } from '@solana/kit';
import {
    identifyLighthouseInstruction,
    LighthouseInstruction,
    parseAssertAccountDataInstruction,
    parseAssertAccountDataMultiInstruction,
    parseAssertAccountDeltaInstruction,
    parseAssertAccountInfoInstruction,
    parseAssertAccountInfoMultiInstruction,
    parseAssertBubblegumTreeConfigAccountInstruction,
    parseAssertMerkleTreeAccountInstruction,
    parseAssertMintAccountInstruction,
    parseAssertMintAccountMultiInstruction,
    parseAssertStakeAccountInstruction,
    parseAssertStakeAccountMultiInstruction,
    parseAssertSysvarClockInstruction,
    parseAssertTokenAccountInstruction,
    parseAssertTokenAccountMultiInstruction,
    parseAssertUpgradeableLoaderAccountInstruction,
    parseAssertUpgradeableLoaderAccountMultiInstruction,
    parseMemoryCloseInstruction,
    parseMemoryWriteInstruction,
} from 'lighthouse-sdk';

import type { KitInstruction } from '@/app/shared/lib/web3js-compat';

import type { LighthouseParsed } from './types';

/**
 * Decode a raw Lighthouse instruction into the canonical `{ type, info }` shape
 * the unified dispatcher consumes. The decode is faithful — assertion operator
 * enums are left as-is; the card formats them for display via
 * `withFormattedOperators`. Returns `undefined` for an unrecognized
 * discriminator (the dispatcher then emits an `UnparsedInstruction`).
 */
export function parseLighthouseInstruction(ix: KitInstruction): LighthouseParsed | undefined {
    try {
        const instruction = identifyLighthouseInstruction(ix);
        switch (instruction) {
            case LighthouseInstruction.MemoryClose:
                return toParsed(instruction, parseMemoryCloseInstruction(ix));
            case LighthouseInstruction.MemoryWrite:
                return toParsed(instruction, parseMemoryWriteInstruction(ix));
            case LighthouseInstruction.AssertMerkleTreeAccount:
                return toParsed(instruction, parseAssertMerkleTreeAccountInstruction(ix));
            case LighthouseInstruction.AssertMintAccount:
                return toParsed(instruction, parseAssertMintAccountInstruction(ix));
            case LighthouseInstruction.AssertAccountData:
                return toParsed(instruction, parseAssertAccountDataInstruction(ix));
            case LighthouseInstruction.AssertAccountDataMulti:
                return toParsed(instruction, parseAssertAccountDataMultiInstruction(ix));
            case LighthouseInstruction.AssertTokenAccount:
                return toParsed(instruction, parseAssertTokenAccountInstruction(ix));
            case LighthouseInstruction.AssertAccountDelta:
                return toParsed(instruction, parseAssertAccountDeltaInstruction(ix));
            case LighthouseInstruction.AssertAccountInfo:
                return toParsed(instruction, parseAssertAccountInfoInstruction(ix));
            case LighthouseInstruction.AssertAccountInfoMulti:
                return toParsed(instruction, parseAssertAccountInfoMultiInstruction(ix));
            case LighthouseInstruction.AssertMintAccountMulti:
                return toParsed(instruction, parseAssertMintAccountMultiInstruction(ix));
            case LighthouseInstruction.AssertTokenAccountMulti:
                return toParsed(instruction, parseAssertTokenAccountMultiInstruction(ix));
            case LighthouseInstruction.AssertStakeAccount:
                return toParsed(instruction, parseAssertStakeAccountInstruction(ix));
            case LighthouseInstruction.AssertStakeAccountMulti:
                return toParsed(instruction, parseAssertStakeAccountMultiInstruction(ix));
            case LighthouseInstruction.AssertUpgradeableLoaderAccount:
                return toParsed(instruction, parseAssertUpgradeableLoaderAccountInstruction(ix));
            case LighthouseInstruction.AssertUpgradeableLoaderAccountMulti:
                return toParsed(instruction, parseAssertUpgradeableLoaderAccountMultiInstruction(ix));
            case LighthouseInstruction.AssertSysvarClock:
                return toParsed(instruction, parseAssertSysvarClockInstruction(ix));
            case LighthouseInstruction.AssertBubblegumTreeConfigAccount:
                return toParsed(instruction, parseAssertBubblegumTreeConfigAccountInstruction(ix));
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

type RawCodamaParsed = {
    accounts?: Record<string, AccountMeta<string>>;
    data: Record<string, unknown>;
};

/** Project a lighthouse-sdk parse result onto the slice's canonical `{ type, info }`. */
function toParsed(instruction: LighthouseInstruction, parsed: RawCodamaParsed): LighthouseParsed {
    return { info: { accounts: parsed.accounts, data: parsed.data }, type: LIGHTHOUSE_INSTRUCTION_NAMES[instruction] };
}
