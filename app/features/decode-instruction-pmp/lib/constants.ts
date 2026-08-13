import { DataSource, Format } from '@solana-program/program-metadata';

/**
 * Re-exported for the decode modules alongside. The definition now lives in the `pmp-account` entity, in a
 * library-free module, so the detection path can reach it without the generated client.
 */
export { PMP_ADDRESS } from '@entities/pmp-account/@x/decode-instruction-pmp';

/**
 * Program label for the card title and the Program row, matching what `CodamaInstructionCard` derives from the
 * IDL for the six housekeeping instructions: the rootNode program name `programMetadata` with its first letter
 * upper-cased. Deliberately NOT the registry name `PROGRAM_NAMES.PROGRAM_METADATA` ('Program Metadata Program'),
 * so a transaction carrying both a `setData` and an `allocate` labels both cards identically.
 */
export const PMP_CODAMA_PROGRAM_NAME = 'ProgramMetadata';

/** Download base names. `DownloadDropdown` appends `_<encoding>.txt`, so no extension belongs here. */
export const PMP_RAW_DOWNLOAD_FILENAME = 'pmp-payload-raw';
export const PMP_DECODED_DOWNLOAD_FILENAME = 'pmp-payload-decoded';
export const PMP_WRITE_CHUNK_DOWNLOAD_FILENAME = 'pmp-write-chunk';
export const PMP_ACCOUNT_RAW_DOWNLOAD_FILENAME = 'pmp-account-raw';

/**
 * Re-exported for the decode modules alongside. The definitions live in the `pmp-instruction` entity, so the wire
 * layout is stated once and the account page's declared-config lookup reads the same numbers this card does.
 */
export { HEADER_ONLY_SET_DATA_LEN, PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX } from '@entities/pmp-instruction';

/**
 * Instruction account order, verified against the generated client's `getXInstruction` builders.
 * These are FINAL row labels, rendered verbatim. They carry Codama's own capitalisation (first letter upper,
 * no word split) so a `setData` card labels its accounts exactly like the `allocate` card next to it, which
 * `CodamaInstructionCard` builds with `charAt(0).toUpperCase() + slice(1)`.
 */
export const PMP_ACCOUNT_NAMES = {
    initialize: ['Metadata', 'Authority', 'Program', 'ProgramData', 'System'],
    setData: ['Metadata', 'Authority', 'Buffer', 'Program', 'ProgramData'],
    write: ['Buffer', 'Authority', 'SourceBuffer'],
} as const;

/** Instruction labels in Codama's style (the IDL name with its first letter upper-cased), for the same reason. */
export const PMP_IX_TITLES = {
    initialize: 'Initialize',
    setData: 'SetData',
    write: 'Write',
} as const;

export const PMP_FORMAT_ANALYTICS_NAMES: Record<Format, string> = {
    [Format.Json]: 'json',
    [Format.None]: 'none',
    [Format.Toml]: 'toml',
    [Format.Yaml]: 'yaml',
};

export const PMP_DATA_SOURCE_ANALYTICS_NAMES: Record<DataSource, string> = {
    [DataSource.Direct]: 'direct',
    [DataSource.External]: 'external',
    [DataSource.Url]: 'url',
};

export const PMP_ANALYTICS_IX_NAMES = {
    initialize: 'initialize',
    setData: 'set_data',
} as const;
