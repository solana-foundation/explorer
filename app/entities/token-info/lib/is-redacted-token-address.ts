// NEXT_PUBLIC_BAD_TOKENS lists mints with inappropriate content.
// The explorer hides the name, symbol and logo of a mint on the list, and keeps its verified flag.
export function isRedactedTokenAddress(address: string): boolean {
    return (
        process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false
    );
}
