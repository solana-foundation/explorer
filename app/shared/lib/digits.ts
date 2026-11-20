/** True when the text is one or more ASCII digits. */
export function isDigits(text: string): boolean {
    return text !== '' && [...text].every(char => char >= '0' && char <= '9');
}
