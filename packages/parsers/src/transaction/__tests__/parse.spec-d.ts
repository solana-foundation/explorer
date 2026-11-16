import type { GetBlockApi, GetTransactionApi, Rpc, Signature } from '@solana/kit';
import { describe, expectTypeOf, it } from 'vitest';

import { type fromCompiledMessage, type fromMessageBytes, fromRpcTransaction } from '../parse.js';
import type {
    ParsedTransaction,
    RawInstruction,
    RpcParsedInstruction,
    RpcTransactionResponse,
    TransactionConfig,
    TransactionInstruction,
} from '../types.js';

declare const rpc: Rpc<GetBlockApi & GetTransactionApi>;
declare const signature: Signature;

const jsonRequest = rpc.getTransaction(signature, { encoding: 'json', maxSupportedTransactionVersion: 0 });
const jsonParsedRequest = rpc.getTransaction(signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 });
const base64Request = rpc.getTransaction(signature, { encoding: 'base64', maxSupportedTransactionVersion: 0 });
const base64BlockRequest = rpc.getBlock(0n, {
    encoding: 'base64',
    maxSupportedTransactionVersion: 0,
    rewards: false,
    transactionDetails: 'full',
});

type KitResponse<T extends { send: () => Promise<unknown> }> = NonNullable<Awaited<ReturnType<T['send']>>>;

declare const jsonResponse: KitResponse<typeof jsonRequest>;
declare const jsonParsedResponse: KitResponse<typeof jsonParsedRequest>;
declare const base64Response: KitResponse<typeof base64Request>;
declare const base64BlockTransaction: KitResponse<typeof base64BlockRequest>['transactions'][number];
declare const anyResponse: RpcTransactionResponse;

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

    it('should carry an optional config on the v1 arm only', () => {
        expectTypeOf<ParsedTransactionOf<1>>().toHaveProperty('config').toEqualTypeOf<TransactionConfig | undefined>();
        expectTypeOf<ParsedTransactionOf<0>>().not.toHaveProperty('config');
        expectTypeOf<ParsedTransactionOf<'legacy'>>().not.toHaveProperty('config');
    });

    it('should accept a transaction narrowed to raw instructions where the default is expected', () => {
        expectTypeOf<ParsedTransaction<RawInstruction>>().toExtend<ParsedTransaction>();
    });
});

describe('TransactionInstruction', () => {
    it('should carry no accounts or data on the RPC-parsed arm', () => {
        expectTypeOf<RpcParsedInstruction>().toHaveProperty('parsed');
        expectTypeOf<RpcParsedInstruction>().not.toHaveProperty('accounts');
        expectTypeOf<RpcParsedInstruction>().not.toHaveProperty('data');
    });

    it('should return only raw instructions from a compiled message', () => {
        expectTypeOf<ReturnType<typeof fromCompiledMessage>['instructions']>().toEqualTypeOf<
            readonly RawInstruction[]
        >();
        expectTypeOf<ReturnType<typeof fromMessageBytes>['instructions']>().toEqualTypeOf<readonly RawInstruction[]>();
    });
});

describe('fromRpcTransaction', () => {
    it('should return only raw instructions for a wire or json response', () => {
        expectTypeOf(fromRpcTransaction(base64Response).instructions).toEqualTypeOf<readonly RawInstruction[]>();
        expectTypeOf(fromRpcTransaction(base64BlockTransaction).instructions).toEqualTypeOf<
            readonly RawInstruction[]
        >();
        expectTypeOf(fromRpcTransaction(jsonResponse).instructions).toEqualTypeOf<readonly RawInstruction[]>();
    });

    it('should keep RPC-parsed instructions possible for a jsonParsed or unknown response', () => {
        expectTypeOf(fromRpcTransaction(jsonParsedResponse).instructions).toEqualTypeOf<
            readonly TransactionInstruction[]
        >();
        expectTypeOf(fromRpcTransaction(anyResponse).instructions).toEqualTypeOf<readonly TransactionInstruction[]>();
    });
});

describe('RpcTransactionResponse', () => {
    it('should accept a kit getTransaction response for every encoding', () => {
        expectTypeOf<KitResponse<typeof jsonRequest>>().toExtend<RpcTransactionResponse>();
        expectTypeOf<KitResponse<typeof jsonParsedRequest>>().toExtend<RpcTransactionResponse>();
        expectTypeOf<KitResponse<typeof base64Request>>().toExtend<RpcTransactionResponse>();
    });
});
