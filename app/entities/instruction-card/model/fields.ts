import type { Address } from '@solana/kit';
import type { PublicKey } from '@solana/web3.js';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';

export type InstructionField =
    InstructionValueField | InstructionHeadingField | InstructionAccountField | InstructionBlockField;

/** A label paired with a value. */
export type InstructionValueField = FieldValue & { label: string };

export type FieldValue =
    | { kind: 'address'; address: Address; tokenLabel?: boolean }
    | { kind: 'sol'; lamports: number | bigint }
    | { kind: 'bytes'; size: number }
    | { kind: 'epoch'; epoch: number | bigint }
    | { kind: 'slot'; slot: number | bigint }
    | { kind: 'string'; value: string }
    | { kind: 'text'; value: string | number }
    | { kind: 'timestamp'; unixSeconds: number }
    | { kind: 'preformatted'; value: string | ReadonlyArray<string | number> }
    | { kind: 'json'; value: Record<string, unknown> };

/** Names the rows that follow it, so it fills the row instead of pairing a label with a value. */
export type InstructionHeadingField = { kind: 'heading'; label: string };

/** An account of the instruction. Its role shows beside the label, as in the account rows of a decoded card. */
export type InstructionAccountField = {
    kind: 'account';
    label: string;
    address: Address;
    isSigner: boolean;
    isWritable: boolean;
};

/** Content too wide for a value cell, so it fills the row without a label column. */
export type InstructionBlockField = PayloadContentBlock | PayloadBlock;

/** The blocks that the decoded tab of a payload can hold. */
export type PayloadContentBlock = NoteBlock | RawDataBlock | DocumentTextBlock;

type NoteBlock = { kind: 'note'; text: string; tone: 'default' | 'warning' };

type RawDataBlock = {
    kind: 'rawData';
    data: Uint8Array;
    filename: string;
    label?: string;
    badge?: { text: string; tone: 'info' | 'warning' };
};

type DocumentTextBlock = { kind: 'documentText'; text: string };

type PayloadBlock = {
    kind: 'payload';
    raw: RawDataBlock;
    decoded: readonly PayloadContentBlock[];
    onTabChange?: (tab: PayloadTab) => void;
};

export type PayloadTab = 'raw' | 'decoded';

/**
 * Falsy entries are dropped, so optional fields read as `cond && address(...)`.
 *
 * `null` is deliberately not accepted: `unicorn/no-null` forbids the literal
 * across `app/**`, so admitting it here would advertise a spelling no caller
 * may write.
 */
export type InstructionFieldList = ReadonlyArray<InstructionField | false | undefined>;

/** `tokenLabel` shows the token name of a mint in place of its address. */
export function address(
    label: string,
    value: PublicKey | Address,
    { tokenLabel }: { tokenLabel?: boolean } = {},
): InstructionField {
    return { address: typeof value === 'string' ? value : toKitAddress(value), kind: 'address', label, tokenLabel };
}

export function account(
    label: string,
    value: PublicKey | Address,
    { isSigner, isWritable }: { isSigner: boolean; isWritable: boolean },
): InstructionField {
    return {
        address: typeof value === 'string' ? value : toKitAddress(value),
        isSigner,
        isWritable,
        kind: 'account',
        label,
    };
}

/** A lamport amount, rendered as SOL. */
export function sol(label: string, lamports: number | bigint): InstructionField {
    return { kind: 'sol', label, lamports };
}

/** An epoch, rendered as a link to its page. */
export function epoch(label: string, value: number | bigint): InstructionField {
    return { epoch: value, kind: 'epoch', label };
}

/** A slot, rendered as a link to its block. */
export function slot(label: string, value: number | bigint): InstructionField {
    return { kind: 'slot', label, slot: value };
}

/** An account data size, rendered as `N byte(s)`. */
export function bytes(label: string, size: number): InstructionField {
    return { kind: 'bytes', label, size };
}

export function string(label: string, value: string): InstructionField {
    return { kind: 'string', label, value };
}

/** Plain text or a number. */
export function text(label: string, value: string | number): InstructionField {
    return { kind: 'text', label, value };
}

/** A unix-seconds instant. The row owns the UTC formatting so cards hold the raw value. */
export function timestamp(label: string, unixSeconds: number): InstructionField {
    return { kind: 'timestamp', label, unixSeconds };
}

/**
 * A value whose whitespace is significant — a hash or key blob shown untruncated, or a
 * list shown one entry per line. Takes the list unjoined so no card spells out the layout.
 */
export function preformatted(label: string, value: string | ReadonlyArray<string | number>): InstructionField {
    return { kind: 'preformatted', label, value };
}

/**
 * A divider that names the rows below it, for a card whose fields fall into repeated
 * groups. It labels the group rather than a value, so it takes the whole row.
 */
export function heading(label: string): InstructionField {
    return { kind: 'heading', label };
}

/** A message about the instruction, such as a state that has no value to show. */
export function note(text: string, tone: NoteBlock['tone'] = 'default'): NoteBlock {
    return { kind: 'note', text, tone };
}

/** Bytes with hex and base64 views, a copy button and a download. `badge` names the form of the bytes. */
export function rawData({
    data,
    filename,
    label,
    badge,
}: {
    data: Uint8Array;
    filename: string;
    label?: string;
    badge?: RawDataBlock['badge'];
}): RawDataBlock {
    return { badge, data, filename, kind: 'rawData', label };
}

/** Display-ready text of a decoded document, shown whole with a copy button. */
export function documentText(text: string): DocumentTextBlock {
    return { kind: 'documentText', text };
}

/** Stored bytes beside what they decode to. The raw tab opens first. */
export function payload({
    raw,
    decoded,
    onTabChange,
}: {
    raw: RawDataBlock;
    decoded: readonly PayloadContentBlock[];
    onTabChange?: (tab: PayloadTab) => void;
}): PayloadBlock {
    return { decoded, kind: 'payload', onTabChange, raw };
}

export function compactFields(fields: InstructionFieldList): InstructionField[] {
    return fields.filter((field): field is InstructionField => Boolean(field));
}
