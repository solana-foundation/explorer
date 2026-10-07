import {
    blockhash,
    type CompiledTransactionMessageWithLifetime,
    type LegacyCompiledTransactionMessage,
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
} from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import {
    InvalidTransactionConfigError,
    MalformedTransactionError,
    UnsupportedTransactionVersionError,
} from '../errors.js';
import {
    fromCompiledMessage,
    fromMessageBytes,
    fromRpcTransaction,
    getAddressTableLookups,
    hasUnmatchedLookupTables,
    isRpcParsedInstruction,
} from '../parse.js';
import type { RpcTransactionResponse } from '../types.js';
import {
    base64WireResponse,
    compiledWithDuplicateFeePayer,
    INSTRUCTION_DATA,
    jsonParsedResponse,
    jsonResponse,
    legacyTransaction,
    legacyTransactionWithHeader,
    transactionWithInstructions,
    twoSignerLegacyTransaction,
    unsignedWireResponse,
    v0CompiledWithFeePayerInLUT,
    v0CompiledWithLookupTable,
    v0Transaction,
    v1CompiledWithConfig,
    v1MessageBytesWithHalfSetPriorityFeeMask,
    v1Transaction,
    wireBytes,
    wireResponse,
} from './fixtures.js';

describe('fromCompiledMessage', () => {
    it('should get the version from the message', () => {
        expect(fromCompiledMessage(legacyTransaction.compiled()).version).toBe('legacy');
        expect(fromCompiledMessage(v0Transaction.compiled()).version).toBe(0);
        expect(fromCompiledMessage(v1Transaction.compiled()).version).toBe(1);
    });

    it('should resolve instructions with their accounts', () => {
        const transaction = fromCompiledMessage(v1Transaction.compiled());

        expect(transaction.instructions).toHaveLength(1);
        expect(transaction.instructions[0].programAddress).toBe(v1Transaction.compiled().staticAccounts[1]);
        expect(transaction.instructions[0]).toHaveProperty(
            'accounts.0.address',
            v1Transaction.compiled().staticAccounts[0],
        );
    });

    it.each(['legacy', 0, 1] as const)(
        'should keep the flags of each index when a %s message lists a key twice',
        version => {
            const compiled = compiledWithDuplicateFeePayer(version);
            const [feePayer] = compiled.staticAccounts;

            expect(fromCompiledMessage(compiled).instructions[0]).toMatchObject({
                accounts: [
                    { address: feePayer, signer: true, writable: true },
                    { address: feePayer, signer: false, writable: false },
                ],
            });
        },
    );

    it('should reject a legacy instruction index past the static keys even when loaded addresses are passed', () => {
        const compiled: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
            header: { numReadonlyNonSignerAccounts: 1, numReadonlySignerAccounts: 0, numSignerAccounts: 1 },
            instructions: [{ accountIndices: [2], programAddressIndex: 1 }],
            lifetimeToken: blockhash(gen.blockhash(7)),
            staticAccounts: [gen.address(1), gen.address(2)],
            version: 'legacy',
        };

        expect(() =>
            fromCompiledMessage(compiled, { loadedAddresses: { readonly: [], writable: [gen.address(3)] } }),
        ).toThrow('Could not find an account address at index 2');
    });

    it('should count every required signer of a compiled message', () => {
        expect(fromCompiledMessage(twoSignerLegacyTransaction().compiled).numSignerAccounts).toBe(2);
    });

    it('should keep a static key apart from its lookup table copy', () => {
        const { compiled, loadedAddresses, lookupTableAddress } = v0CompiledWithFeePayerInLUT();
        const [feePayer] = compiled.staticAccounts;

        const transaction = fromCompiledMessage(compiled, { loadedAddresses });

        expect(transaction.instructions[0]).toHaveProperty('accounts', [
            { address: feePayer, signer: true, source: 'static', writable: true },
            { address: feePayer, lookupTableAddress, signer: false, source: 'lookupTable', writable: true },
        ]);
    });

    it.each(['legacy', 0, 1] as const)('should keep empty instruction data on a %s message', version => {
        const transaction = transactionWithInstructions(version, [{ programAddress: gen.address(30) }]);

        expect(transaction.instructions[0]).toHaveProperty('data', new Uint8Array(0));
    });

    it('should read the config from a v1 message', () => {
        const transaction = fromCompiledMessage(
            v1CompiledWithConfig({
                configMask: TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
                configValues: [{ kind: 'u32', value: 19 }],
            }),
        );

        expect(transaction).toMatchObject({ config: { computeUnitLimit: 19 }, version: 1 });
    });

    it.each([
        ['legacy', legacyTransaction],
        ['v1', v1Transaction],
    ] as const)('should return no address table lookups for a %s transaction', (_label, fixture) => {
        expect(getAddressTableLookups(fromCompiledMessage(fixture.compiled()))).toEqual([]);
    });

    it('should return no address table lookups when a v0 message lists no tables', () => {
        expect(getAddressTableLookups(fromCompiledMessage(v0Transaction.compiled()))).toEqual([]);
    });

    it('should resolve a loaded address when the caller passes it as a plain string', () => {
        const { compiled, loadedAddress } = v0CompiledWithLookupTable();
        const writable: string[] = [loadedAddress];

        const transaction = fromCompiledMessage(compiled, { loadedAddresses: { readonly: [], writable } });

        expect(transaction.accounts).toContainEqual(
            expect.objectContaining({ address: loadedAddress, source: 'lookupTable' }),
        );
    });

    it('should return unmatched addresses for a v0 message with no listed lookup tables', () => {
        const transaction = fromCompiledMessage(v0Transaction.compiled(), {
            loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] },
        });

        expect(transaction).toMatchObject({
            unmatchedLookupTableAddresses: [gen.address(5), gen.address(6)],
            version: 0,
        });
    });

    it('should map compiled lookup table address to accountKey', () => {
        const { compiled, loadedAddress, lookupTableAddress } = v0CompiledWithLookupTable();
        const transaction = fromCompiledMessage(compiled, {
            loadedAddresses: { readonly: [], writable: [loadedAddress] },
        });

        expect(getAddressTableLookups(transaction)).toEqual([
            { accountKey: lookupTableAddress, readonlyIndexes: [], writableIndexes: [0] },
        ]);
    });

    it('should reject a v0 message that loads lookup table accounts without loaded addresses', () => {
        expect(() => fromCompiledMessage(v0CompiledWithLookupTable().compiled)).toThrow('Missing loadedAddresses');
    });

    it('should return unmatched addresses for a v0 message with more loaded addresses than its lookup table lists', () => {
        const { compiled, loadedAddress } = v0CompiledWithLookupTable();
        const extraAddress = gen.address(12);

        const transaction = fromCompiledMessage(compiled, {
            loadedAddresses: { readonly: [], writable: [loadedAddress, extraAddress] },
        });

        expect(transaction).toMatchObject({ unmatchedLookupTableAddresses: [extraAddress], version: 0 });
    });

    it('should reject a compiled message with a zero signer count', () => {
        const { compiled } = legacyTransactionWithHeader({ numSignerAccounts: 0 });

        expect(() => fromCompiledMessage(compiled)).toThrow('out of range for');
    });

    it('should reject a compiled message with a negative readonly signer count', () => {
        const { compiled } = legacyTransactionWithHeader({ numReadonlySignerAccounts: -1 });

        expect(() => fromCompiledMessage(compiled)).toThrow('negative readonly account count');
    });

    it('should reject a compiled message where readonly signers exceed available accounts', () => {
        const { compiled } = legacyTransactionWithHeader({ numReadonlySignerAccounts: 1 });

        expect(() => fromCompiledMessage(compiled)).toThrow('exceed available accounts');
    });
});

describe('fromMessageBytes', () => {
    it.each([
        ['legacy', legacyTransaction],
        ['v0', v0Transaction],
        ['v1', v1Transaction],
    ] as const)('should decode %s message bytes into the same value as the compiled message', (_label, fixture) => {
        expect(fromMessageBytes(fixture.messageBytes())).toEqual(fromCompiledMessage(fixture.compiled()));
    });

    it('should reject bytes that carry more than the message', () => {
        const messageBytes = v1Transaction.messageBytes();
        const trailing = new Uint8Array([...messageBytes, 0x00]);

        expect(() => fromMessageBytes(trailing)).toThrow(
            `Transaction message bytes have trailing data or a non-canonical encoding: ` +
                `${trailing.length} bytes in, ${messageBytes.length} bytes re-encoded.`,
        );
    });

    it('should reject message bytes with an invalid header', () => {
        const { messageBytes } = legacyTransactionWithHeader({ numSignerAccounts: 0 });

        expect(() => fromMessageBytes(messageBytes)).toThrow('out of range for');
    });

    it('should reject v0 message bytes that load lookup table accounts without loaded addresses', () => {
        expect(() => fromMessageBytes(v0CompiledWithLookupTable().messageBytes)).toThrow('Missing loadedAddresses');
    });

    it('should reject message bytes of an unknown version', () => {
        const bytes = v1Transaction.messageBytes();
        bytes[0] = 0x82;

        expect(() => fromMessageBytes(bytes)).toThrow(UnsupportedTransactionVersionError);
        expect(() => fromMessageBytes(bytes)).toThrow('Unsupported transaction version: 2');
    });

    it('should reject v1 message bytes that set only one of the two priority fee mask bits', () => {
        expect(() => fromMessageBytes(v1MessageBytesWithHalfSetPriorityFeeMask())).toThrow(
            InvalidTransactionConfigError,
        );
    });
});

describe('fromRpcTransaction', () => {
    it('should parse the version and instructions of a wire response', () => {
        const transaction = fromRpcTransaction(wireResponse(1));

        expect(transaction.version).toBe(1);
        expect(transaction.instructions).toEqual(fromCompiledMessage(v1Transaction.compiled()).instructions);
    });

    it('should return the signatures from wire tx', () => {
        expect(fromRpcTransaction(wireResponse(1)).signatures).toEqual([gen.signature(1)]);
    });

    it('should return undefined for an unsigned signer slot', () => {
        expect(fromRpcTransaction(unsignedWireResponse(1)).signatures[0]).toBeUndefined();
    });

    it('should decode a base58-encoded response to the same value as a base64 one', () => {
        expect(fromRpcTransaction(wireResponse(1, 'base58'))).toEqual(fromRpcTransaction(wireResponse(1, 'base64')));
    });

    it.each(['base64', 'base58'] as const)(
        'should read the version from the bytes when a %s wire response omits it',
        encoding => {
            const { transaction } = wireResponse(1, encoding);

            expect(fromRpcTransaction({ transaction }).version).toBe(1);
        },
    );

    it('should read the version from the bytes when a wire response reports a null version', () => {
        // eslint-disable-next-line unicorn/no-null -- null stands for a response with no `version` field
        expect(fromRpcTransaction({ ...wireResponse(0), version: null }).version).toBe(0);
    });

    it('should reject a wire response that reports an unknown version', () => {
        expect(() =>
            fromRpcTransaction({ ...wireResponse(1), version: 2 } as unknown as RpcTransactionResponse),
        ).toThrow(UnsupportedTransactionVersionError);
    });

    it('should reject a wire response whose reported version disagrees with its bytes', () => {
        expect(() => fromRpcTransaction({ ...wireResponse(1), version: 0 })).toThrow('version mismatch');
    });

    it.each(['legacy', 0, 1] as const)('should reject %s wire bytes with trailing data', version => {
        const bytes = new Uint8Array([...wireBytes(version), 0]);

        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow('trailing data');
    });

    it.each(['legacy', 0, 1] as const)('should reject %s wire bytes cut short by one byte', version => {
        const bytes = wireBytes(version).slice(0, -1);

        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow();
    });

    it('should reject v1 wire bytes that set only one of the two priority fee mask bits', () => {
        const bytes = new Uint8Array([...v1MessageBytesWithHalfSetPriorityFeeMask(), ...new Uint8Array(64)]);

        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow(InvalidTransactionConfigError);
    });

    it.each(['base58', 'base64'] as const)('should reject a wire response with an invalid %s string', encoding => {
        const response = { transaction: ['0OIl***', encoding] as const };

        expect(() => fromRpcTransaction(response)).toThrow(MalformedTransactionError);
    });

    it('should reject v1 wire bytes of an unknown version', () => {
        const bytes = wireBytes(1);
        bytes[0] = 0x82;

        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow(UnsupportedTransactionVersionError);
        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow('Unsupported transaction version: 2');
    });

    it('should reject v0 wire bytes whose message is of an unknown version', () => {
        const bytes = wireBytes(0);
        const messageStart = 1 + 64;
        bytes[messageStart] = 0x82;

        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow(UnsupportedTransactionVersionError);
        expect(() => fromRpcTransaction(base64WireResponse(bytes))).toThrow('Unsupported transaction version: 2');
    });

    it('should resolve the loaded addresses from wire response meta', () => {
        const response = {
            ...wireResponse(0),
            meta: { loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] } },
        };

        const { accounts } = fromRpcTransaction(response);

        expect(accounts.slice(-2).map(account => account.address)).toEqual([gen.address(5), gen.address(6)]);
    });

    it('should read a json response, decoding its base58 instruction data', () => {
        const transaction = fromRpcTransaction(jsonResponse(1));

        expect(transaction.version).toBe(1);
        expect(transaction.instructions[0]).toHaveProperty('data', INSTRUCTION_DATA);
    });

    it('should keep empty instruction data on a JSON response', () => {
        const response = jsonResponse(1);
        response.transaction.message.instructions = [{ accounts: [0], data: '', programIdIndex: 1 }];

        expect(fromRpcTransaction(response).instructions[0]).toHaveProperty('data', new Uint8Array(0));
    });

    it('should resolve v0 JSON instruction accounts loaded from a lookup table', () => {
        const response = jsonResponse(0);
        const table = gen.address(9);
        const [feePayer] = response.transaction.message.accountKeys;
        response.transaction.message.addressTableLookups = [
            { accountKey: table, readonlyIndexes: [1], writableIndexes: [0] },
        ];
        response.transaction.message.instructions = [{ accounts: [0, 2, 3], data: '', programIdIndex: 1 }];
        const withMeta = {
            ...response,
            meta: { loadedAddresses: { readonly: [gen.address(6)], writable: [gen.address(5)] } },
        };

        expect(fromRpcTransaction(withMeta).instructions[0]).toHaveProperty('accounts', [
            { address: feePayer, signer: true, source: 'static', writable: true },
            {
                address: gen.address(5),
                lookupTableAddress: table,
                signer: false,
                source: 'lookupTable',
                writable: true,
            },
            {
                address: gen.address(6),
                lookupTableAddress: table,
                signer: false,
                source: 'lookupTable',
                writable: false,
            },
        ]);
    });

    it('should read a v0 JSON response with an address table lookup', () => {
        const response = jsonResponse(0);
        const table = gen.address(9);
        response.transaction.message.addressTableLookups = [
            { accountKey: table, readonlyIndexes: [], writableIndexes: [] },
        ];

        expect(getAddressTableLookups(fromRpcTransaction(response))).toEqual([
            { accountKey: table, readonlyIndexes: [], writableIndexes: [] },
        ]);
    });

    it('should report lookup indexes when no loaded address matches them', () => {
        const response = jsonResponse(0);
        const table = gen.address(9);
        response.transaction.message.addressTableLookups = [
            { accountKey: table, readonlyIndexes: [], writableIndexes: [3] },
        ];
        const withEmptyMeta = { ...response, meta: { loadedAddresses: { readonly: [], writable: [] } } };

        expect(fromRpcTransaction(withEmptyMeta)).toMatchObject({
            unmatchedLookupTableIndexes: [{ accountKey: table, readonlyIndexes: [], writableIndexes: [3] }],
            version: 0,
        });
    });

    it('should reject a v0 JSON response with lookup tables and no loaded addresses', () => {
        const response = jsonResponse(0);
        response.transaction.message.addressTableLookups = [
            { accountKey: gen.address(9), readonlyIndexes: [], writableIndexes: [3] },
        ];

        expect(() => fromRpcTransaction(response)).toThrow('Missing loadedAddresses');
    });
    it('should leave lookups unreported when a v0 JSON response omits them', () => {
        const transaction = fromRpcTransaction(jsonResponse(0));

        expect(transaction.version).toBe(0);
        expect('addressTableLookups' in transaction).toBe(false);
    });

    it('should count jsonParsed signers from the RPC signer flags', () => {
        const response = jsonParsedResponse(1);
        response.transaction.message.accountKeys = [
            ...response.transaction.message.accountKeys,
            { pubkey: gen.address(20), signer: true, source: 'transaction', writable: false },
        ];

        expect(fromRpcTransaction(response).numSignerAccounts).toBe(2);
    });

    it('should read a jsonParsed response with RPC-resolved account roles', () => {
        const transaction = fromRpcTransaction(jsonParsedResponse(1));

        expect(transaction.accounts[0]).toMatchObject({ signer: true, source: 'static', writable: true });
    });

    it('should carry only the RPC decode when a jsonParsed instruction has no data', () => {
        const response = jsonParsedResponse(1);
        const programId = response.transaction.message.accountKeys[1].pubkey;
        response.transaction.message.instructions = [{ parsed: { type: 'transfer' }, program: 'system', programId }];

        const transaction = fromRpcTransaction(response);

        expect(transaction.instructions[0]).toEqual({ parsed: { type: 'transfer' }, programAddress: programId });
    });

    it('should resolve a jsonParsed instruction account against a lookup-table-sourced key', () => {
        const response = jsonParsedResponse(0);
        const lookupAddress = gen.address(8);
        const program = response.transaction.message.accountKeys[1].pubkey;

        response.transaction.message.accountKeys = [
            ...response.transaction.message.accountKeys,
            { pubkey: lookupAddress, signer: false, source: 'lookupTable', writable: true },
        ];
        response.transaction.message.instructions = [{ accounts: [lookupAddress], data: '2Jq', programId: program }];

        const transaction = fromRpcTransaction(response);

        expect(transaction.instructions[0]).toMatchObject({
            accounts: [{ address: lookupAddress, source: 'lookupTable' }],
        });
    });

    it('should reject a jsonParsed instruction account missing from accountKeys', () => {
        const response = jsonParsedResponse(1);
        const program = response.transaction.message.accountKeys[1].pubkey;
        response.transaction.message.instructions = [{ accounts: [gen.address(11)], data: '2Jq', programId: program }];

        expect(() => fromRpcTransaction(response)).toThrow('not in the resolved account list');
    });

    it.each([
        ['raw', { accounts: [], data: '2Jq', programId: gen.address(11) }],
        ['parsed', { parsed: { type: 'transfer' }, program: 'system', programId: gen.address(11) }],
    ] as const)('should reject a %s jsonParsed instruction whose program is missing from accountKeys', (_label, ix) => {
        const response = jsonParsedResponse(1);
        response.transaction.message.instructions = [ix];

        expect(() => fromRpcTransaction(response)).toThrow('not in the resolved account list');
    });

    it('should read the address table lookups of a jsonParsed v0 response', () => {
        const response = jsonParsedResponse(0);
        const table = gen.address(9);
        response.transaction.message.addressTableLookups = [
            { accountKey: table, readonlyIndexes: [4], writableIndexes: [3] },
        ];

        expect(getAddressTableLookups(fromRpcTransaction(response))).toEqual([
            { accountKey: table, readonlyIndexes: [4], writableIndexes: [3] },
        ]);
    });

    it('should leave lookups unreported when a v0 jsonParsed response omits them', () => {
        const transaction = fromRpcTransaction(jsonParsedResponse(0));

        expect(transaction.version).toBe(0);
        expect('addressTableLookups' in transaction).toBe(false);
        expect(getAddressTableLookups(transaction)).toEqual([]);
    });

    it('should reject a null version', () => {
        // eslint-disable-next-line unicorn/no-null -- null stands for a response with no `version` field
        expect(() => fromRpcTransaction({ ...jsonResponse(1), version: null })).toThrow(
            UnsupportedTransactionVersionError,
        );
    });

    it('should reject an unknown version', () => {
        expect(() =>
            fromRpcTransaction({ ...jsonResponse(1), version: 2 } as unknown as RpcTransactionResponse),
        ).toThrow(UnsupportedTransactionVersionError);
    });

    it('should reject a header when the signer count exceeds the account list', () => {
        const response = jsonResponse(0);
        response.transaction.message.header.numRequiredSignatures = 99;

        expect(() => fromRpcTransaction(response)).toThrow('out of range for');
    });

    it('should reject a header with a zero signer count', () => {
        const response = jsonResponse(0);
        response.transaction.message.header.numRequiredSignatures = 0;

        expect(() => fromRpcTransaction(response)).toThrow('out of range for');
    });

    it('should reject a header with a negative readonly account count', () => {
        const response = jsonResponse(0);
        response.transaction.message.header.numReadonlySignedAccounts = -1;

        expect(() => fromRpcTransaction(response)).toThrow('negative readonly account count');
    });

    it('should reject a header when readonly counts exceed available accounts', () => {
        const response = jsonResponse(0);
        response.transaction.message.header.numReadonlySignedAccounts = 1;

        expect(() => fromRpcTransaction(response)).toThrow('exceed available accounts');
    });

    it('should throw when an account index is out of range', () => {
        const response = jsonResponse(0);
        const accountCount = response.transaction.message.accountKeys.length;
        response.transaction.message.instructions = [{ accounts: [accountCount], data: '', programIdIndex: 1 }];

        expect(() => fromRpcTransaction(response)).toThrow('index out of bounds');
    });

    it('should throw when the program index is out of range', () => {
        const response = jsonResponse(0);
        const accountCount = response.transaction.message.accountKeys.length;
        response.transaction.message.instructions = [{ accounts: [0], data: '', programIdIndex: accountCount }];

        expect(() => fromRpcTransaction(response)).toThrow('index out of bounds');
    });
});

describe('hasUnmatchedLookupTables', () => {
    it.each([
        ['legacy', legacyTransaction],
        ['v1', v1Transaction],
    ] as const)('should return false for a %s transaction', (_label, fixture) => {
        expect(hasUnmatchedLookupTables(fixture())).toBe(false);
    });

    it('should return false when the loaded addresses fill every lookup table slot', () => {
        const { compiled, loadedAddress } = v0CompiledWithLookupTable();
        const transaction = fromCompiledMessage(compiled, {
            loadedAddresses: { readonly: [], writable: [loadedAddress] },
        });

        expect(hasUnmatchedLookupTables(transaction)).toBe(false);
    });

    it('should return true when a loaded address matches no lookup table slot', () => {
        const transaction = fromCompiledMessage(v0Transaction.compiled(), {
            loadedAddresses: { readonly: [], writable: [gen.address(5)] },
        });

        expect(hasUnmatchedLookupTables(transaction)).toBe(true);
    });

    it('should return true when a lookup table slot has no loaded address', () => {
        const response = jsonResponse(0);
        response.transaction.message.addressTableLookups = [
            { accountKey: gen.address(9), readonlyIndexes: [], writableIndexes: [3] },
        ];
        const withEmptyMeta = { ...response, meta: { loadedAddresses: { readonly: [], writable: [] } } };

        expect(hasUnmatchedLookupTables(fromRpcTransaction(withEmptyMeta))).toBe(true);
    });
});

describe('isRpcParsedInstruction', () => {
    it('should return true for an instruction the RPC parsed', () => {
        expect(isRpcParsedInstruction({ parsed: { type: 'transfer' }, programAddress: gen.systemProgram })).toBe(true);
    });

    it('should return false for an instruction with data and no accounts', () => {
        expect(
            isRpcParsedInstruction({ accounts: [], data: new Uint8Array(0), programAddress: gen.systemProgram }),
        ).toBe(false);
    });
});
