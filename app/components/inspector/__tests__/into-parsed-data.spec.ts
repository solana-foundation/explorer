import * as spl from '@solana/spl-token';
import { AddressLookupTableAccount, clusterApiUrl, Connection, PublicKey, TransactionMessage } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { privateIntoParsedData } from '../into-parsed-data';

describe('intoParsedData', () => {
    test('should return "create" instruction data', async () => {
        const index = 2;
        const message = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(message.addressTableLookups.map(lookup => connection.getAddressLookupTable(lookup.accountKey).then((val) => val.value)));
        const tx = TransactionMessage.decompile(message, { addressLookupTableAccounts: lookups.filter((x) => x !== null) as AddressLookupTableAccount[] });
        const ix = tx.instructions[index];
        const data = privateIntoParsedData(ix);
        expect(data.type).toBe('create');
        expect(data.info.data).toEqual({ discriminator: 0 });
        expect(data.info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'),
            new PublicKey('9E3HDj8spudEWc26h5wu8EUpyfYDbJjjVYaZpv49nzGH'),
            new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'),
            new PublicKey('So11111111111111111111111111111111111111112'),
            new PublicKey('11111111111111111111111111111111'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ];
        Object.values(data.info.accounts as { address: string, role: number }[]).forEach((account, index) => {
            expect(new PublicKey(account.address).equals(expectedAccounts[index])).toBeTruthy();
        });
        expect(Object.keys(data.info.accounts)).toEqual(['payer', 'ata', 'owner', 'mint', 'systemProgram', 'tokenProgram']);
    });

    test('should return "createIdempotent" instruction data', async () => {
        const index = 1;
        const message = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(message.addressTableLookups.map(lookup => connection.getAddressLookupTable(lookup.accountKey).then((val) => val.value)));
        const tx = TransactionMessage.decompile(message, { addressLookupTableAccounts: lookups.filter((x) => x !== null) as AddressLookupTableAccount[] });
        const ix = tx.instructions[index];
        const data = privateIntoParsedData(ix);
        expect(data.type).toBe('createIdempotent');
        expect(data.info.data).toEqual({ discriminator: 1 });
        expect(data.info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'),
            new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'),
            new PublicKey('11111111111111111111111111111111'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ];
        Object.values(data.info.accounts as { address: string, role: number }[]).forEach((account, index) => {
            expect(account.address).toEqual(expectedAccounts[index].toBase58());
        });
        expect(Object.keys(data.info.accounts)).toEqual(['payer', 'ata', 'owner', 'mint', 'systemProgram', 'tokenProgram']);
    });

    test('should return "recoverNested" instruction data', async () => {
        const index = 0;
        const message = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(message.addressTableLookups.map(lookup => connection.getAddressLookupTable(lookup.accountKey).then((val) => val.value)));
        const tx = TransactionMessage.decompile(message, { addressLookupTableAccounts: lookups.filter((x) => x !== null) as AddressLookupTableAccount[] });
        const ix = tx.instructions[index];
        const data = privateIntoParsedData(ix);
        expect(data.type).toBe('recoverNested');
        expect(data.info.data).toEqual({ discriminator: 2 });
        expect(data.info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('CfR4Z2zwj2Wz5eX6GLf34CYiyK8hestfvpfub9LLDnNR'),
            new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            new PublicKey('4dbCSgnyU8V8HqmFHcRqwBym3dUQK2MVacXQgAkaeYKU'),
            new PublicKey('BSqjYANCyCpxTneP9KsWMexwZkk5XJ1nkKws1Zg3X9KH'),
            new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            new PublicKey('3UgveoWTHgDWH4DC8NUoYcQc11vJ8xzk2hCge2ZWPDSL'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ];
        Object.values(data.info.accounts as { address: string, role: number }[]).forEach((account, index) => {
            expect(new PublicKey(account.address).equals(expectedAccounts[index])).toBeTruthy();
        });
        expect(Object.keys(data.info.accounts)).toEqual(['nestedAssociatedAccountAddress', 'nestedTokenMintAddress', 'destinationAssociatedAccountAddress', 'ownerAssociatedAccountAddress', 'ownerTokenMintAddress', 'walletAddress', 'tokenProgram']);
    });
});
