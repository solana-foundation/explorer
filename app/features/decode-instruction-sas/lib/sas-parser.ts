import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';
import {
    parseSolanaAttestationServiceInstruction,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
    SolanaAttestationServiceInstruction,
} from '@solana/attestation';
import type { AccountMeta } from '@solana/kit';

export { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS };

/** The RPC never pre-parses this program, so this is a synthetic label carried through the dispatcher. */
export const SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL = 'solana-attestation-service' satisfies ParserProgramLabel;

/** Every SAS instruction parses to named accounts plus an argument struct; only the struct's shape differs. */
export type SolanaAttestationInfo = {
    accounts: Record<string, AccountMeta>;
    data: Record<string, unknown>;
};

/** `type` is the instruction's name in camelCase, e.g. `createCredential`. */
export type SolanaAttestationParsed = ParsedInstructionInfo<string, SolanaAttestationInfo>;

export function parseSolanaAttestationKitInstruction(ix: KitInstruction): SolanaAttestationParsed | undefined {
    let parsed: ReturnType<typeof parseSolanaAttestationServiceInstruction>;
    try {
        parsed = parseSolanaAttestationServiceInstruction(ix);
    } catch {
        // The generated client throws for a discriminator it does not know; the dispatcher renders that as unknown.
        return undefined;
    }

    const name = SolanaAttestationServiceInstruction[parsed.instructionType];
    return {
        info: { accounts: parsed.accounts, data: parsed.data },
        type: name.charAt(0).toLowerCase() + name.slice(1),
    };
}
