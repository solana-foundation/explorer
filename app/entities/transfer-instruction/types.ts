import type { ParsedInstruction } from '@solana/web3.js';

export type TokenTransferParsed =
    | {
          type: 'transferChecked';
          info: {
              source?: string;
              destination?: string;
              authority?: string;
              mint?: string;
              tokenAmount?: {
                  uiAmountString?: string | null;
                  amount?: string;
                  decimals?: number;
              };
          };
      }
    | {
          type: 'transfer2';
          info: {
              source?: string;
              destination?: string;
              authority?: string;
              mint?: string;
              tokenAmount?: {
                  uiAmountString?: string | null;
                  amount?: string;
                  decimals?: number;
              };
          };
      }
    | {
          type: 'transfer';
          info: {
              amount?: string;
              source?: string;
              destination?: string;
              authority?: string;
          };
      };

export type SolTransferParsed = {
    type: 'transfer';
    info: {
        source?: string;
        destination?: string;
        lamports?: number;
    };
};

export type TokenTransferInstruction = ParsedInstruction & { parsed: TokenTransferParsed };

export type SolTransferInstruction = ParsedInstruction & { parsed: SolTransferParsed };
