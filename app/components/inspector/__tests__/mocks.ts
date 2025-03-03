/**
 * Contains servialized VersionedMessages which can be viewed at the inspector by related URLs
 */
import { MessageCompiledInstruction, MessageV0, PublicKey, VersionedMessage } from "@solana/web3.js";

export function deserialize(message: string): VersionedMessage{
    return JSON.parse(message);
}

export function deserializeMessageV0(message: string): VersionedMessage {
    const m = JSON.parse(message);
    const vm = new MessageV0({
        addressTableLookups: m.addressTableLookups.map((atl: {
            accountKey: string,
            writableIndexes: number[],
            readonlyIndexes: number[],
        }) => {
            return {
                accountKey: new PublicKey(atl.accountKey),
                readonlyIndexes: atl.readonlyIndexes,
                writableIndexes: atl.writableIndexes,
            };
        }),
        compiledInstructions: m.compiledInstructions.map((ci: {
            programIdIndex: number,
            accountKeyIndexes: number[],
            data: { [key: string]: number } | { type: 'Buffer', data: number[] }
        }) => {
            let data: Uint8Array;
            if ('type' in ci.data) {
                data = Uint8Array.from(ci.data.data as number[]);
            } else {
                data = new Uint8Array([...Object.values(ci.data)]);
            }

            return {
                accountKeyIndexes: ci.accountKeyIndexes,
                data: data,
                programIdIndex: ci.programIdIndex,
            };
        }),
        header: m.header,
        recentBlockhash: m.recentBlockhash,
        staticAccountKeys: m.staticAccountKeys.map((sak: string) => new PublicKey(sak)),
    });

    return vm;
}

export function deserializeInstruction(instruction: string): MessageCompiledInstruction {
    const data = JSON.parse(instruction);
    console.log("DD", data, data.data);
    data.data = Uint8Array.from(data.data.data);
    console.log("dd", data.data);

    return data;
}

// write simple test-case to not tweak the configuration as jest will fail the test-suite as file would not be covered otherwise
test('should deserialize', () => { expect(deserialize('{}')).toEqual({}); });

// ComputeBudget computeBudget instructions
// http://localhost:3000/tx/inspector?message=gAIABgwLFFx82WdzBluGohZnk8TmXq%252F0pUUnxhpjxSNMraGelLVLQTka3xzxe6hY3Q5dyh8MwvAULx%252BJiPZjdz6%252FaB0L9Lqt3uRNrVn1pxcSD2DLOW0u7YcBbR9bqZdxSdFeT%252FwUlFkNon7Uoh%252BC72aIW5YavKARbD1UjdRpAiXrDl0ryvzVcRVtGJcJNXfKuwGjzfmQhFehPY9M8ebYtDAMvSK8srY9g9IH4ppqsXreT6D%252BTmlKdu2JXmEcnGtzHE8Q9OIDBkZv5SEXMv%252Fsrbpyw5vnvIzlu8X3EmssQ5s6QAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQR51VvyMcBu7nTFbs5oFQf9sbLeo%252FSOUQKxzaJWvBOPtD%252F6J%252FXX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5eicyfP%252FJFK6VWlYc2EGEyE78uvE0UgAvaW5%252BvYLw8BggAYGAAkDZK1tAAAAAAAGAAUCEmACAAcGAAIBEggJAQEHBgADARMICQEBCi0JAQQCChIFCwoUCQ8VDxARDw8PDw8PDw8EAwEUCQwVDA0ODAwMDAwMDAwDAgEn5RfLl3rjrSoCAAAAB2QAAQdkAQIAypo7AAAAAKeXKAIAAAAAlgBVCQMDAQEBCQLiCK3IP8r%252FwRrlsnWHJ6M%252FxtgYtM4dwqjJg6tYf5r2EgMfIKEE2QYREMI4UPEU19u%252Bw1q7jjS3B54B4IVrQrOf4fF1hSod0iZUA1eTUwA%253D
export const message1 = '{"header":{"numRequiredSignatures":2,"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6},"staticAccountKeys":["kFVZ5bdn3c9tMoY4ibqsLDNd6vxt3HwHVcZC5b6ra1y","DChMF3Q8TKaRFCk6LYHcJp8w4pyHKkLjfTYCmR7iyfox","HUKaYJCzbTXN7JzgtQhGGUThmES3NeksNcbyzD4QoBoh","2PLMWNViAaRdNnBvB6zutQ9Cg5bMyWtX7BEYb15XzE8R","J1xWWZPTZDWVydStvZwVgpt2VmqqbUKGLJuP7FajGu2T","D2ckBJDNmnJJkZSz1qDLCXjhcuBiY4T9tPJZ9cpbHZ3o","ComputeBudget111111111111111111111111111111","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","11111111111111111111111111111111","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4","D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf"],"recentBlockhash":"BZ3D8mjoY3Exwh31DpPzAze1aH9hRMunJg9xrT8aTnCo","compiledInstructions":[{"programIdIndex":6,"accountKeyIndexes":[],"data":{"0":3,"1":100,"2":173,"3":109,"4":0,"5":0,"6":0,"7":0,"8":0}},{"programIdIndex":6,"accountKeyIndexes":[],"data":{"0":2,"1":18,"2":96,"3":2,"4":0}},{"programIdIndex":7,"accountKeyIndexes":[0,2,1,18,8,9],"data":{"0":1}},{"programIdIndex":7,"accountKeyIndexes":[0,3,1,19,8,9],"data":{"0":1}},{"programIdIndex":10,"accountKeyIndexes":[9,1,4,2,10,18,5,11,10,20,9,15,21,15,16,17,15,15,15,15,15,15,15,15,4,3,1,20,9,12,21,12,13,14,12,12,12,12,12,12,12,12,3,2,1],"data":{"0":229,"1":23,"2":203,"3":151,"4":122,"5":227,"6":173,"7":42,"8":2,"9":0,"10":0,"11":0,"12":7,"13":100,"14":0,"15":1,"16":7,"17":100,"18":1,"19":2,"20":0,"21":202,"22":154,"23":59,"24":0,"25":0,"26":0,"27":0,"28":167,"29":151,"30":40,"31":2,"32":0,"33":0,"34":0,"35":0,"36":150,"37":0,"38":85}},{"programIdIndex":9,"accountKeyIndexes":[3,1,1],"data":{"0":9}}],"addressTableLookups":[{"accountKey":"GDLpHg53y5sufRSftvZscFMwdSqP8kHaLwhsT4ZwYSaV","writableIndexes":[31,32,161],"readonlyIndexes":[217,6,17,16]},{"accountKey":"E59uBXGqn83xN17kMbBVfU1M7T4wHG91eiygHb88Aovb","writableIndexes":[87,147,83],"readonlyIndexes":[]}]}';

// Atoken createIdempotent instruction
// http://localhost:3000/tx/Nwa7VZEfhbPV2MmW4dQNebj6Pw1TrJH9j2G3pL7Vt4Hr2rTzyEPdh1LBd4SKtzEBhC1MKMDEeaQuz96FZzQSyYk/inspect
export const instruction2 = '{"programIdIndex":22,"accountKeyIndexes":[0,14,0,21,18,26],"data":{"type":"Buffer","data":[1]}}';
export const message2 = '{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6,"numRequiredSignatures":1},"staticAccountKeys":["EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb","2qZ3FFpD9kPVS3MRYQNDGqfrh6JzjNpqXNp5kopv2PMk","3wrAqm2ouWgzVnk7Cxv2GbM6VUeGBtZuSEakApjQk4VZ","4ahjvr2TN7yViD8b54S1TCC2CokRfSBYErYT3Zd7rK9u","6LXAHyQ9AZs8LcQoUqpj6RswaZGxkM6vmx9CPDoiy8cd","8DKit81gfTDtTYN4SMWHwAc3UJywbHNEJThXjLrzb17s","8czgpWaHCjyXpLAUqqZqWZEw4ZYrAonfaKyLCRN2M58X","9hDBGGCrLwQtdxbw2TUzpzLEZM8psxVBhBpbJDAMibq6","9jPRczqDFNkuQyF6MBhnsZqyURUzNJzGXpNM1NxxocQF","AUN7WQptCU5qSgmDSDtiSzQivQVhmTfDndJgEtj2RDD6","AZYJEfo2mjqLV3PsCPcDjmgyDnyq9ur5KCgbpCJokXLf","Big1xZ1pnMdrjkF3buyJTC2kfKgmrRVgBN7dpekF5LCd","ENE5MsxSPqoKVg2TH2QabAKRBRwdsAq2cMiqydsnSN4s","F3AwqJLiqFUGQnfq8QVEtJQWRPztq2WmuFEgfE1L2Nb7","Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1","GjFdibHr9YDtqnKW3pc7ChzmsqWeptvVwQijAnY3LkLb","Guo7CcsFvD8BrRPppdGZ9cRjXqjNYD33nHiN2gdijzdj","Ht7TduEGJjBMDXXozEUMJPq592r8x33UXuLdD5uPFc5m","11111111111111111111111111111111","ComputeBudget111111111111111111111111111111","JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4","74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf"],"recentBlockhash":"9W45XzEpCW1PNZY6xpixc1AGTSTe1DVxA3PXaBvc6met","compiledInstructions":[{"programIdIndex":19,"accountKeyIndexes":[],"data":{"type":"Buffer","data":[2,160,247,3,0]}},{"programIdIndex":22,"accountKeyIndexes":[0,14,0,21,18,26],"data":{"type":"Buffer","data":[1]}},{"programIdIndex":20,"accountKeyIndexes":[26,0,1,1,20,25,20,23,20,24,3,24,8,7,1,14,21,25,16,24,0,26,26,28,24,4,11,9,20,27,0,29,12,14,1,13,15,2,26,17,10,6,20],"data":{"type":"Buffer","data":[229,23,203,151,122,227,173,42,2,0,0,0,38,100,0,1,26,100,1,0,128,240,250,2,0,0,0,0,176,101,251,2,0,0,0,0,0,0,0]}},{"programIdIndex":18,"accountKeyIndexes":[0,5],"data":{"type":"Buffer","data":[2,0,0,0,104,243,33,0,0,0,0,0]}}],"addressTableLookups":[{"accountKey":"EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH","readonlyIndexes":[89,123,69,80,90,94],"writableIndexes":[]}]}';
