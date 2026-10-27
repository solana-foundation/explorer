import type { LegacyAnchorEvent } from '../../lib/types';
import { parseIdlType } from './format-constants';
import type { EventData, StructField } from './formatted-idl';

// Render a pre-0.30 Anchor event (name + inline fields) as a struct, matching how accounts and types
// render on the same tab. `publicKey` is normalized to Codama's `pubkey` spelling so the Events tab
// reads the same as the rest of the converted IDL.
export function formatEvents(events?: readonly LegacyAnchorEvent[]): EventData[] | undefined {
    if (!events?.length) return undefined;
    return events.map(event => ({
        docs: [],
        fieldType: { fields: eventFields(event), kind: 'struct' },
        name: event.name,
    }));
}

function eventFields(event: LegacyAnchorEvent): StructField[] {
    return (event.fields ?? []).map(field => ({
        name: field.name,
        type: normalizePublicKey(parseIdlType(field.type)),
    }));
}

function normalizePublicKey(type: string): string {
    return type === 'publicKey' ? 'pubkey' : type;
}
