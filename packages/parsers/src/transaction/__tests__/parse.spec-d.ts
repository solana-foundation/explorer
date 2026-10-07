import type { GetTransactionApi, Rpc, Signature } from '@solana/kit';
import { describe, expectTypeOf, it } from 'vitest';

import type { ParsedTransaction, RpcParsedInstruction, RpcTransactionResponse } from '../types.js';

declare const rpc: Rpc<GetTransactionApi>;
declare const signature: Signature;

const jsonRequest = rpc.getTransaction(signature, { encoding: 'json', maxSupportedTransactionVersion: 0 });
const jsonParsedRequest = rpc.getTransaction(signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 });
const base64Request = rpc.getTransaction(signature, { encoding: 'base64', maxSupportedTransactionVersion: 0 });

type KitResponse<T extends { send: () => Promise<unknown> }> = NonNullable<Awaited<ReturnType<T['send']>>>;

type ParsedTransactionOf<V extends ParsedTransaction['version']> = Extract<ParsedTransaction, { version: V }>;

describe('ParsedTransaction', () => {
    it('should carry the unmatched lookup table fields on the v0 arm only', () => {
        expectTypeOf<ParsedTransactionOf<0>>().toHaveProperty('unmatchedLookupTableAddresses');
        expectTypeOf<ParsedTransactionOf<0>>().toHaveProperty('unmatchedLookupTableIndexes');
        expectTypeOf<ParsedTransactionOf<'legacy'>>().not.toHaveProperty('unmatchedLookupTableAddresses');
        expectTypeOf<ParsedTransactionOf<'legacy'>>().not.toHaveProperty('unmatchedLookupTableIndexes');
        expectTypeOf<ParsedTransactionOf<1>>().not.toHaveProperty('unmatchedLookupTableAddresses');
        expectTypeOf<ParsedTransactionOf<1>>().not.toHaveProperty('unmatchedLookupTableIndexes');
    });
});

describe('TransactionInstruction', () => {
    it('should carry no accounts or data on the RPC-parsed arm', () => {
        expectTypeOf<RpcParsedInstruction>().toHaveProperty('parsed');
        expectTypeOf<RpcParsedInstruction>().not.toHaveProperty('accounts');
        expectTypeOf<RpcParsedInstruction>().not.toHaveProperty('data');
    });
});

describe('RpcTransactionResponse', () => {
    it('should accept a kit getTransaction response for every encoding', () => {
        expectTypeOf<KitResponse<typeof jsonRequest>>().toExtend<RpcTransactionResponse>();
        expectTypeOf<KitResponse<typeof jsonParsedRequest>>().toExtend<RpcTransactionResponse>();
        expectTypeOf<KitResponse<typeof base64Request>>().toExtend<RpcTransactionResponse>();
    });
});
