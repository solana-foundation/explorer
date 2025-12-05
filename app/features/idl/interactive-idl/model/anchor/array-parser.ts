import { array, coerce, create, string, unknown } from 'superstruct';

const CommaSeparatedArray = coerce(array(string()), string(), value => value.split(',').map(v => v.trim()));

/**
 * Superstruct schema for parsing array inputs
 * Handles JSON arrays and comma-separated strings
 */
export const ArrayInputSchema = coerce(array(unknown()), unknown(), value => {
    // If already an array, return as-is
    if (Array.isArray(value)) return value;

    // If not a string, wrap in array
    if (typeof value !== 'string') return [value];

    const trimmed = value.trim();

    // Handle empty string
    if (trimmed === '') return [];

    // If it starts with '[', treat as JSON
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            throw new Error(`Invalid JSON array: ${trimmed}`);
        }
    }

    // Use CommaSeparatedArray for comma-separated values
    return create(trimmed, CommaSeparatedArray);
});

/**
 * Parse array input using the superstruct schema
 */
export function parseArrayInput(value: any): any[] {
    return create(value, ArrayInputSchema);
}
