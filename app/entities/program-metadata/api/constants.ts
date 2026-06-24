// Shared error copy for the program-metadata API routes. PMP PDA seeds (`idl`, `security`) are no
// longer declared here — @solana/idl and @solana/security-txt derive them internally.
export const errors = {
    500: 'Metadata fetch failed',
};
