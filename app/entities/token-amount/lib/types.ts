export type TokenAmount = {
    amount: bigint | number;
    decimals: number;
};

// An account read adjusts `uiAmountString` for the mint extensions and a transaction does not, so
// a balance holds the raw amount only.
export type RawTokenBalance = {
    accountIndex: number;
    mint: string;
    owner?: string;
    uiTokenAmount: { amount: string; decimals: number };
};
