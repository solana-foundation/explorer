import type { Address } from '@solana/kit';
import type { PublicKey } from '@solana/web3.js';
import type { ReactElement } from 'react';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';

export type InstructionField = InstructionValueField | InstructionHeadingField;

/** A label paired with a value, which is every row except a group's heading. */
export type InstructionValueField = FieldValue & { label: string };

export type FieldValue =
    | { kind: 'address'; address: Address }
    | { kind: 'sol'; lamports: number | bigint }
    | { kind: 'bytes'; size: number }
    | { kind: 'string'; value: string }
    | { kind: 'text'; value: string | number }
    | { kind: 'timestamp'; unixSeconds: number }
    | { kind: 'preformatted'; value: string | ReadonlyArray<string | number> }
    | { kind: 'custom'; value: ReactElement };

/** Names the rows that follow it, so it fills the row instead of pairing a label with a value. */
export type InstructionHeadingField = { kind: 'heading'; label: string };

/**
 * Falsy entries are dropped, so optional fields read as `cond && address(...)`.
 *
 * `null` is deliberately not accepted: `unicorn/no-null` forbids the literal
 * across `app/**`, so admitting it here would advertise a spelling no caller
 * may write.
 */
export type InstructionFieldList = ReadonlyArray<InstructionField | false | undefined>;

export function address(label: string, value: PublicKey | Address): InstructionField {
    return { address: typeof value === 'string' ? value : toKitAddress(value), kind: 'address', label };
}

/** A lamport amount, rendered as SOL. */
export function sol(label: string, lamports: number | bigint): InstructionField {
    return { kind: 'sol', label, lamports };
}

/** An account data size, rendered as `N byte(s)`. */
export function bytes(label: string, size: number): InstructionField {
    return { kind: 'bytes', label, size };
}

export function string(label: string, value: string): InstructionField {
    return { kind: 'string', label, value };
}

/** Plain text or a number. Deliberately not `ReactElement` — use `custom` for markup. */
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

/**
 * Escape hatch for fields the vocabulary above does not cover — token amounts
 * needing mint decimals, nested structs, bespoke widgets. Prefer a new `kind`
 * once a shape repeats across programs.
 *
 * Takes a `ReactElement` rather than a `ReactNode` so a row always has
 * something to draw. `ReactNode` admits `undefined`, `false`, and `''`, which
 * would make a labelled blank row representable — use `text` for plain values
 * and omit the field entirely when there is nothing to show.
 */
export function custom(label: string, value: ReactElement): InstructionField {
    return { kind: 'custom', label, value };
}

export function compactFields(fields: InstructionFieldList): InstructionField[] {
    return fields.filter((field): field is InstructionField => Boolean(field));
}
