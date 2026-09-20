import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    parseComputeBudgetInstruction,
} from '@solana-program/compute-budget';

export { COMPUTE_BUDGET_PROGRAM_ADDRESS };

/** The RPC never pre-parses this program, so this is a synthetic label carried through the dispatcher. */
export const COMPUTE_BUDGET_PROGRAM_LABEL = 'compute-budget' satisfies ParserProgramLabel;

export type RequestUnitsInfo = { units: number; additionalFee: number };
export type RequestHeapFrameInfo = { bytes: number };
export type SetComputeUnitLimitInfo = { units: number };
export type SetComputeUnitPriceInfo = { microLamports: bigint };
export type SetLoadedAccountsDataSizeLimitInfo = { accountDataSizeLimit: number };

export type ComputeBudgetParsed =
    | ParsedInstructionInfo<'requestUnits', RequestUnitsInfo>
    | ParsedInstructionInfo<'requestHeapFrame', RequestHeapFrameInfo>
    | ParsedInstructionInfo<'setComputeUnitLimit', SetComputeUnitLimitInfo>
    | ParsedInstructionInfo<'setComputeUnitPrice', SetComputeUnitPriceInfo>
    | ParsedInstructionInfo<'setLoadedAccountsDataSizeLimit', SetLoadedAccountsDataSizeLimitInfo>;

export function parseComputeBudgetKitInstruction(ix: KitInstruction): ComputeBudgetParsed | undefined {
    let parsed: ReturnType<typeof parseComputeBudgetInstruction>;
    try {
        parsed = parseComputeBudgetInstruction(ix);
    } catch {
        // The generated client throws for a discriminator it does not know; the dispatcher renders that as unknown.
        return undefined;
    }

    switch (parsed.instructionType) {
        case ComputeBudgetInstruction.RequestUnits:
            return {
                info: { additionalFee: parsed.data.additionalFee, units: parsed.data.units },
                type: 'requestUnits',
            };
        case ComputeBudgetInstruction.RequestHeapFrame:
            return { info: { bytes: parsed.data.bytes }, type: 'requestHeapFrame' };
        case ComputeBudgetInstruction.SetComputeUnitLimit:
            return { info: { units: parsed.data.units }, type: 'setComputeUnitLimit' };
        case ComputeBudgetInstruction.SetComputeUnitPrice:
            return { info: { microLamports: parsed.data.microLamports }, type: 'setComputeUnitPrice' };
        case ComputeBudgetInstruction.SetLoadedAccountsDataSizeLimit:
            return {
                info: { accountDataSizeLimit: parsed.data.accountDataSizeLimit },
                type: 'setLoadedAccountsDataSizeLimit',
            };
    }
}
