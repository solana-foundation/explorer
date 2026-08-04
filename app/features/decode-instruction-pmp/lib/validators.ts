import { Compression, Encoding, Format } from '@solana-program/program-metadata';
import { enums, object } from 'superstruct';

/**
 * Runtime shape of the three decode hints, for the one path that reads them as raw bytes: the 4-byte header-only
 * `setData`. Every other shape goes through a generated decoder that already rejects an out-of-range enum byte,
 * so this is the only place unvalidated chain data enters the slice.
 *
 * The variants are listed explicitly rather than derived with `Object.values`, because a numeric TypeScript enum's
 * runtime object also carries its reverse mapping (`{ 0: 'None', None: 0, ... }`), which would admit the label
 * strings as valid values. Listing them also means a new library variant is a compile error here.
 */
export const PmpDecodeConfigStruct = object({
    compression: enums([Compression.None, Compression.Gzip, Compression.Zlib]),
    encoding: enums([Encoding.None, Encoding.Utf8, Encoding.Base58, Encoding.Base64]),
    format: enums([Format.None, Format.Json, Format.Yaml, Format.Toml]),
});
