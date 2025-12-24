/**
 * Generates naming convention variations from a list of words.
 *
 * @param words - Array of words to combine (e.g., ['associated', 'token', 'program'])
 * @param additionalKeys - Extra keys to append to the variations (default: [])
 * @returns Array of naming variations in different conventions, plus additional keys
 *
 * @example
 * generateNameVariations(['system', 'program'], ['system'])
 * // Returns: ['systemProgram', 'system_program', 'system program', 'systemprogram', 'system']
 *
 * @example
 * generateNameVariations(['associated', 'token', 'program'], ['associatedToken', 'associated'])
 * // Returns: [
 * //   'associatedTokenProgram', 'associated_token_program', 'associated token program', 'associatedtokenprogram',
 * //   'associatedToken', 'associated'
 * // ]
 */
export function generateNameVariations(words: string[], additionalKeys: string[] = []): string[] {
    return [...generateConventions(words), ...additionalKeys];
}

function generateConventions(words: string[]): string[] {
    const lowerWords = words.map(w => w.toLowerCase());
    const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

    return [
        lowerWords[0] + lowerWords.slice(1).map(capitalize).join(''), // camelCase
        lowerWords.join('_'), // snake_case
        lowerWords.join(' '), // space separated
        lowerWords.join(''), // concatenated
    ];
}
