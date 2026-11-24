import type { IntentUnavailableReason } from './intent';

// Apart from lib/intent.ts so the intent row does not bundle the Codama parser wherever card code is bundled
const UNAVAILABLE_TEXT: Record<IntentUnavailableReason, string> = {
    'idl-failed': "Couldn't load this program's IDL.",
    'malformed-metadata': "Couldn't use this program's intent metadata.",
    'no-instruction-intent': "This program's intent metadata doesn't describe this instruction.",
    'no-metadata': "This program doesn't publish intent metadata.",
};

export function getIntentUnavailableText(reason: IntentUnavailableReason): string {
    return UNAVAILABLE_TEXT[reason];
}
