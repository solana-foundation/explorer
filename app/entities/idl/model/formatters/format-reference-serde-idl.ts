import { formatIdl } from '../converters/convert-reference-legacy-idl';

/**
 * Reference implementation for convertLegacyIdl. Keep it to be aware of its limitations
 *
 * Do not meant to be used on the client. Keep it to see the default behaviour at tests
 *
 * @param idl
 * @param programAddress
 * @returns
 */
export function formatReferenceSerdeIdl(idl: NonNullable<object>, programAddress: string) {
    return formatIdl(idl, programAddress);
}
