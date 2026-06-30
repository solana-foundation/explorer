import { IntegerOperator } from 'lighthouse-sdk';

// `IntegerOperator` is a superset of `EquatableOperator` and the two agree on
// `Equal`/`NotEqual`, so a single table keyed by the raw enum value formats both.
const OPERATOR_SYMBOLS: Record<number, string> = {
    [IntegerOperator.Equal]: '=',
    [IntegerOperator.NotEqual]: '!=',
    [IntegerOperator.GreaterThan]: '>',
    [IntegerOperator.LessThan]: '<',
    [IntegerOperator.GreaterThanOrEqual]: '>=',
    [IntegerOperator.LessThanOrEqual]: '<=',
    [IntegerOperator.Contains]: 'contains',
    [IntegerOperator.DoesNotContain]: 'does not contain',
};

/**
 * Returns a copy of decoded Lighthouse instruction data with every numeric
 * `operator` field replaced by its human-readable comparison symbol. Pure: the
 * parsed model stays faithful (operators remain enums) — this runs at the UI
 * boundary, just before data is rendered to a table. Non-plain values
 * (Uint8Array, bigint, pubkey strings) pass through untouched by reference.
 */
export function withFormattedOperators<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(item => withFormattedOperators(item)) as T;
    }
    if (isPlainObject(value)) {
        const formatted: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value)) {
            formatted[key] =
                key === 'operator' && typeof item === 'number'
                    ? (OPERATOR_SYMBOLS[item] ?? item)
                    : withFormattedOperators(item);
        }
        return formatted as T;
    }
    return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
