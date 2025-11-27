import { formatIdl } from '../converters/convert-legacy-idl';

/**
 * Format IDL according its type
 *
 * @param idl
 * @param programAddress
 * @returns
 */
export function formatSerdeIdl(idl: NonNullable<object>, programAddress?: string) {
    return formatIdl(idl, programAddress);
}
