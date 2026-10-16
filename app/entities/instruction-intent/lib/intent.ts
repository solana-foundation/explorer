import { getRequiredAccountsForDisplay } from '@codama/dynamic-instructions';
import { type ParsedInstruction, parseInstruction } from '@codama/dynamic-parsers';
import type { KitInstruction } from '@explorer/parsers';
import type { Address } from '@solana/kit';
import { getLastNodeFromPath, type RootNode, validateCodamaVersion } from 'codama';
import { array, is, literal, optional, string, type } from 'superstruct';

export type IntentSupportStatus =
    { status: 'none' } | { status: 'unsupported' } | { status: 'supported'; root: RootNode };

export type IntentSupportResult = { status: 'loading' } | { status: 'failed' } | IntentSupportStatus;

/** Whether the instruction has an intent functionality. `retry` is set only when retrying possible. */
export type InstructionIntentAvailability =
    | { status: 'present'; instruction: KitInstruction }
    | { status: 'pending' }
    | { status: 'absent'; retry?: () => void };

export type IntentSentencePart = { kind: 'text'; text: string } | { kind: 'address'; address: Address };

export type IntentField = { label: string; value: string };

export type InstructionIntent = {
    sentenceParts: readonly IntentSentencePart[];
    /** False when a template value could not be filled and the sentence is the short intent label. */
    interpolated: boolean;
    fields: readonly IntentField[];
    /** The intent depends on live account state, which can differ from the state at the transaction's slot. */
    usedAccountData: boolean;
};

export type IntentUnavailableReason = 'no-metadata' | 'idl-failed' | 'no-instruction-intent' | 'malformed-metadata';

export type InstructionIntentResult =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'failed'; retry?: () => void }
    | { status: 'unavailable'; reason: IntentUnavailableReason }
    | { status: 'ready'; result: InstructionIntent };

export type InstructionIntentExistence =
    | { status: 'exists'; parsed: ParsedInstruction; addresses: readonly Address[] }
    | {
          status: 'unavailable';
          reason: Extract<IntentUnavailableReason, 'no-instruction-intent' | 'malformed-metadata'>;
      };

const RootNodeWithIntentShape = type({
    kind: literal('rootNode'),
    program: type({
        instructions: array(type({ display: optional(type({ interpolatedIntent: optional(string()) })) })),
    }),
    version: string(),
});

const UNAVAILABLE_TEXT: Record<IntentUnavailableReason, string> = {
    'idl-failed': "Couldn't load this program's IDL.",
    'malformed-metadata': "Couldn't use this program's intent metadata.",
    'no-instruction-intent': "This program's intent metadata doesn't describe this instruction.",
    'no-metadata': "This program doesn't publish intent metadata.",
};

/** Whether a Program Metadata IDL can produce intents: a Codama root of a compatible version with a template. */
export function checkIntentSupport(idl: unknown): IntentSupportStatus {
    if (!is(idl, RootNodeWithIntentShape)) return { status: 'none' };

    try {
        validateCodamaVersion(idl.version as RootNode['version']);
    } catch {
        return { status: 'unsupported' };
    }

    if (!idl.program.instructions.some(instruction => Boolean(instruction.display?.interpolatedIntent))) {
        return { status: 'none' };
    }

    // Only the fields read here are checked: checkInstructionIntentExists catches a malformed deeper node
    return { root: idl as unknown as RootNode, status: 'supported' };
}

/**
 * Parses an instruction against the root and keeps it only when its node publishes an intent template.
 * Also plans the accounts the intent reads, so a later step only fetches them.
 */
export function checkInstructionIntentExists(root: RootNode, instruction: KitInstruction): InstructionIntentExistence {
    try {
        const parsed = parseInstruction(root, instruction);
        if (!parsed || !getLastNodeFromPath(parsed.path).display?.interpolatedIntent) {
            return { reason: 'no-instruction-intent', status: 'unavailable' };
        }
        const addresses = [...getRequiredAccountsForDisplay(root, parsed)].sort();
        return { addresses, parsed, status: 'exists' };
    } catch {
        // A published IDL is untrusted, and a malformed node throws while the parser or the planner walks the root
        return { reason: 'malformed-metadata', status: 'unavailable' };
    }
}

export function getIntentUnavailableText(reason: IntentUnavailableReason): string {
    return UNAVAILABLE_TEXT[reason];
}
