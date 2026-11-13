// NEXT_PUBLIC_BAD_TOKENS lists mints with inappropriate content.
// A token verification badge does not hide that content.
export function isRedactedTokenAddress(address: string): boolean {
    return (
        process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false
    );
}
