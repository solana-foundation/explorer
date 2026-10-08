import { DataSource, Format } from '@solana-program/program-metadata';

export { PMP_ADDRESS } from '@entities/pmp-account/@x/decode-instruction-pmp';

export const PMP_IDL_PROGRAM_NAME = 'programMetadata';

export const PMP_RAW_DOWNLOAD_FILENAME = 'pmp-payload-raw';
export const PMP_DECODED_DOWNLOAD_FILENAME = 'pmp-payload-decoded';
export const PMP_WRITE_CHUNK_DOWNLOAD_FILENAME = 'pmp-write-chunk';

export { PMP_METADATA_ACCOUNT_INDEX, PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX } from '@entities/pmp-instruction';

export const PMP_ACCOUNT_NAMES = {
    initialize: ['metadata', 'authority', 'program', 'programData', 'system'],
    setData: ['metadata', 'authority', 'buffer', 'program', 'programData'],
    write: ['buffer', 'authority', 'sourceBuffer'],
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
