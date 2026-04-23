export type FieldKind = 'authority' | 'amount' | 'pubkey' | 'scalar' | 'option' | 'neutral';

export type DecodedValue =
    | { kind: 'pubkey'; base58: string; isNone?: boolean }
    | { kind: 'amount'; raw: bigint; decimals?: number }
    | { kind: 'scalar'; value: number | string; label?: string }
    | { kind: 'option'; present: boolean }
    | { kind: 'text'; value: string }
    | { kind: 'unparsed'; reason: 'no-jsonparsed' | 'unknown-ext' | 'truncated' };

export interface LayoutField {
    id: string;
    name: string;
    start: number;
    length: number;
    kind: FieldKind;
}

export interface Region extends LayoutField {
    decodedValue: DecodedValue;
}
