import {
    PMP_COMPRESSION_LABELS,
    PMP_DATA_SOURCE_LABELS,
    PMP_ENCODING_LABELS,
    PMP_FORMAT_LABELS,
    type PmpAccountHeader,
} from '@entities/pmp-account';
import { unwrapOption } from '@solana/kit';

type MetadataHeader = Extract<PmpAccountHeader, { kind: 'metadata' }>;
type BufferHeader = Extract<PmpAccountHeader, { kind: 'buffer' }>;

/**
 * How a field's value is presented. Deliberately named after Codama type-node kinds rather than after PMP's own
 * fields, because this vocabulary is the seam: a future IDL-driven build maps `publicKeyTypeNode -> 'pubkey'`,
 * `booleanTypeNode -> 'bool'`, `enumTypeNode -> 'enum'` and so on, and reuses the renderers below unchanged.
 */
export type FieldType = 'bool' | 'enum' | 'number' | 'pubkey' | 'string';

/**
 * One rendered row.
 *
 * `field` and `type` are the half a Codama IDL could supply: `field` is the name as it appears in the account node
 * (`app/entities/idl/mocks/codama/codama-1.0.0-ProgM6JCC*.json`, `program.accounts[].data.fields[].name`), and
 * `type` is that field's type node collapsed to the vocabulary above. The label and the `data-testid` are DERIVED
 * from `field` by `FieldRows`, so neither has to be restated here.
 *
 * What stays hand-written is PMP policy the schema does not express, and would survive an IDL migration unchanged:
 * `value`, because the enums decode to numbers whose display strings live in the `PMP_*_LABELS` maps, and `when`,
 * because a keypair buffer leaves canonical and seed unwritten.
 */
export type FieldDescriptor<TData> = {
    field: string;
    type: FieldType;
    /** `undefined` renders as "None" - the account does not carry this value. */
    value: (header: TData) => boolean | string | undefined;
    /** Row-level policy. `data` is excluded simply by never being listed - it renders as a document, not a field. */
    when?: (header: TData) => boolean;
};

export const METADATA_HEADER_FIELDS: FieldDescriptor<MetadataHeader>[] = [
    { field: 'program', type: 'pubkey', value: h => h.account.program },
    { field: 'authority', type: 'pubkey', value: h => unwrapOption(h.account.authority) ?? undefined },
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

export const BUFFER_HEADER_FIELDS: FieldDescriptor<BufferHeader>[] = [
    { field: 'authority', type: 'pubkey', value: h => unwrapOption(h.account.authority) ?? undefined },
    { field: 'program', type: 'pubkey', value: h => unwrapOption(h.account.program) ?? undefined },
    { field: 'canonical', type: 'bool', value: h => h.account.canonical, when: isPdaBuffer },
    { field: 'seed', type: 'string', value: h => h.account.seed || '-', when: isPdaBuffer },
];

function isPdaBuffer(header: BufferHeader): boolean {
    return unwrapOption(header.account.program) !== null;
}
