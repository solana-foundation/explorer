export const OPEN_BOOK_PROGRAM_ID = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';

export const SERUM_PROGRAM_IDS = [
    '4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn',
    '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    OPEN_BOOK_PROGRAM_ID,
];

// Every Serum DEX version except OpenBook is abandoned; kept only to decode historical transactions.
export const DEPRECATED_SERUM_PROGRAM_IDS = SERUM_PROGRAM_IDS.filter(id => id !== OPEN_BOOK_PROGRAM_ID);

export const SERUM_DECODED_MAX = 6;
