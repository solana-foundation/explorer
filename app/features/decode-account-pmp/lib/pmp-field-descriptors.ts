import {
    PMP_COMPRESSION_LABELS,
    PMP_DATA_SOURCE_LABELS,
    PMP_ENCODING_LABELS,
    PMP_FORMAT_LABELS,
    type PmpAccountReadResult,
} from '@entities/pmp-account';
import { unwrapOption } from '@solana/kit';
import type { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';

type MetadataHeader = Extract<PmpAccountReadResult, { kind: 'metadata' }>;
type BufferHeader = Extract<PmpAccountReadResult, { kind: 'buffer' }>;

/**
 * How a field's value is presented. Deliberately named after Codama type-node kinds rather than after PMP's own
 * fields, because this vocabulary is the seam: a future IDL-driven build maps `publicKeyTypeNode -> 'pubkey'`,
 * `booleanTypeNode -> 'bool'`, `enumTypeNode -> 'enum'` and so on, and reuses the renderers below unchanged.
 */
export type FieldType = 'bool' | 'enum' | 'number' | 'pubkey' | 'string';

/**
 * One rendered row. `data` is excluded simply by never being listed - it renders as a document, not a field.
 */
export type FieldDescriptor<TData> = {
    field: string;
    type: FieldType;
    /**
     * `undefined` drops the row - the field does not apply here, or nothing resolved it.
     * `null` renders "None" - the row exists and the stored value is genuinely absent.
     *
     * `null` is what `unwrapOption` returns, so an Option-backed field needs no adapter. It is also rendered BEFORE
     * the `type` dispatch, which is what keeps an absent pubkey away from `new PublicKey()`.
     */
    value: (data: TData) => boolean | string | null | undefined;
};

export const METADATA_HEADER_FIELDS: FieldDescriptor<MetadataHeader>[] = [
    { field: 'program', type: 'pubkey', value: h => h.account.program },
    { field: 'authority', type: 'pubkey', value: h => unwrapOption(h.account.authority) },
    { field: 'mutable', type: 'bool', value: h => h.account.mutable },
    { field: 'canonical', type: 'bool', value: h => h.account.canonical },
    { field: 'seed', type: 'string', value: h => h.account.seed || '-' },
];

export const METADATA_CONFIG_FIELDS: FieldDescriptor<MetadataHeader>[] = [
    { field: 'encoding', type: 'enum', value: h => PMP_ENCODING_LABELS[h.account.encoding] },
    { field: 'compression', type: 'enum', value: h => PMP_COMPRESSION_LABELS[h.account.compression] },
    { field: 'format', type: 'enum', value: h => PMP_FORMAT_LABELS[h.account.format] },
    { field: 'dataSource', type: 'enum', value: h => PMP_DATA_SOURCE_LABELS[h.account.dataSource] },
    { field: 'dataLength', type: 'number', value: h => `${h.account.dataLength} byte(s)` },
];

/** Same leading order as `METADATA_HEADER_FIELDS`, so a buffer and the metadata twin it feeds scan side by side. */
export const BUFFER_HEADER_FIELDS: FieldDescriptor<BufferHeader>[] = [
    { field: 'program', type: 'pubkey', value: h => unwrapOption(h.account.program) },
    { field: 'authority', type: 'pubkey', value: h => unwrapOption(h.account.authority) },
    { field: 'canonical', type: 'bool', value: h => (isPdaBuffer(h) ? h.account.canonical : undefined) },
    { field: 'seed', type: 'string', value: h => (isPdaBuffer(h) ? h.account.seed || '-' : undefined) },
];

/**
 * Whether this buffer sits at a PDA, which is what makes `canonical` and `seed` mean anything.
 *
 * `allocate` writes program/canonical/seed together or not at all: the keypair path passes none of the three, the
 * canonical and non-canonical PDA paths pass all three. So a null `program` is proof the other two are untouched
 * zero bytes rather than stored values.
 */
function isPdaBuffer(header: BufferHeader): boolean {
    return unwrapOption(header.account.program) !== null;
}

/**
 * A Buffer's decode config, which is RESOLVED rather than read off the account.
 *
 * Every axis but compression is optional, and that is the point: an axis nothing resolved is omitted rather than
 * rendered as "Unknown", because a row would imply the card tried and failed. Compression is always present
 * because a bounded inflate settles it either way - a clean inflate and a clean rejection are both answers.
 */
export type BufferConfigRow = {
    compression: Compression;
    /** Only ever set from a resolved config. The bytes cannot assert an encoding - see `resolve-buffer-config-from-bytes`. */
    encoding: Encoding | undefined;
    format: Format | undefined;
    /** Not recoverable from bytes at all, so it appears only once the history lookup returns one. */
    dataSource: DataSource | undefined;
};

export const BUFFER_CONFIG_FIELDS: FieldDescriptor<BufferConfigRow>[] = [
    { field: 'compression', type: 'enum', value: row => PMP_COMPRESSION_LABELS[row.compression] },
    {
        field: 'encoding',
        type: 'enum',
        value: row => (row.encoding === undefined ? undefined : PMP_ENCODING_LABELS[row.encoding]),
    },
    {
        field: 'format',
        type: 'enum',
        value: row => (row.format === undefined ? undefined : PMP_FORMAT_LABELS[row.format]),
    },
    {
        field: 'dataSource',
        type: 'enum',
        value: row => (row.dataSource === undefined ? undefined : PMP_DATA_SOURCE_LABELS[row.dataSource]),
    },
];
