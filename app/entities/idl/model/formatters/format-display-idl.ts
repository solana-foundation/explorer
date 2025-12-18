import { Idl } from '@coral-xyz/anchor';

import {
    convertDisplayIdl,
    getIdlSpecType as getDisplayIdlSpecType,
    type IdlSpec,
} from '../converters/convert-display-idl';
import { type LegacyIdl, removeUnusedTypes } from '../converters/convert-legacy-idl';
import type { IdlFormatter } from './formatted-idl';

/// Write a layer to register current formatters as well as to a add new one
const formattersRegistry = new Map<IdlSpec, IdlFormatter>();

/**
 * Register a formatter
 */
function registerFormatter<T extends IdlFormatter>(key: IdlSpec, fn: T) {
    formattersRegistry.set(key, fn);
}

registerFormatter('0.1.0', idl => idl as Idl);

registerFormatter('legacy', (idl, programAddress) => {
    return removeUnusedTypes(convertDisplayIdl(idl as LegacyIdl, programAddress));
});

registerFormatter('legacy-shank', (idl, programAddress) => {
    return removeUnusedTypes(convertDisplayIdl(idl as LegacyIdl, programAddress));
});

/**
 * Format IDL to display it in a human-readable way according its type
 *
 * @param idl
 * @param programAddress
 * @returns
 */
export const formatDisplayIdl: IdlFormatter = (idl: unknown, programAddress?: string) => {
    const displayIdlSpecType = getDisplayIdlSpecType(idl);

    // get a spec formatter. we should cover all formatters, fallback is not needed
    const formatter = formattersRegistry.get(displayIdlSpecType);

    if (!formatter) {
        throw new Error(`IDL spec not supported: ${displayIdlSpecType}`);
    }

    return formatter(idl, programAddress);
};
