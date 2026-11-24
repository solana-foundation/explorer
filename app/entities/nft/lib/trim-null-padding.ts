// umi keeps Token Metadata's fixed-width NUL padding, so an empty symbol arrives as NULs, not ''.
export function trimNullPadding(value: string): string {
    let end = value.length;
    while (end > 0 && value[end - 1] === '\0') end--;
    return value.slice(0, end);
}
