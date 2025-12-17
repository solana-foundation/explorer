import { PublicKey } from '@solana/web3.js';

import type { Account, NFTData } from '@/app/providers/accounts';
import type { TokenExtension } from '@/app/validators/accounts/token-extension';

export function getMockAccountWithNFTData(): Account {
    return {
        data: {
            parsed: {
                nftData: getNftData(),
                parsed: {
                    info: {
                        decimals: 6,
                        freezeAuthority: '7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar',
                        isInitialized: true,
                        mintAuthority: 'BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG',
                        supply: '12140091115171322',
                    },
                    type: 'mint',
                },
                program: 'spl-token',
            },
        },
        executable: false,
        lamports: 419054176820,
        owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        space: 82,
    } as unknown as Account; // Account type is incomplete and incorrect for some fields, fixing it would require a lot of unrelated changes
}

export function getMockAccountWithTokenMetadata(): Account {
    return {
        data: {
            parsed: {
                parsed: {
                    info: {
                        decimals: 6,
                        extensions: getTokenExtension(),
                        freezeAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                        isInitialized: true,
                        mintAuthority: 'FtrZqgM9begkaLHq3f4hGEUrAK1jjJpkc8hZ1hVk3EDN',
                        supply: '997647954721900',
                    },
                    type: 'mint',
                },
                program: 'spl-token-2022',
            },
        },
        executable: false,
        lamports: 2064720952,
        owner: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        pubkey: new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
        space: 866,
    };
}

export function getMockAccountWithTokenMetadataAndMetaplexMetadata(): Account {
    return {
        data: {
            parsed: {
                nftData: getNftData(),
                parsed: {
                    info: {
                        decimals: 6,
                        extensions: getTokenExtension(),
                        freezeAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                        isInitialized: true,
                        mintAuthority: 'FtrZqgM9begkaLHq3f4hGEUrAK1jjJpkc8hZ1hVk3EDN',
                        supply: '997647954721900',
                    },
                    type: 'mint',
                },
                program: 'spl-token-2022',
            },
        },
        executable: false,
        lamports: 2064720952,
        owner: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        pubkey: new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
        space: 866,
    };
}

export function getMockAccountWithCompressedNft(): Account {
    return {
        data: {
            raw: new Uint8Array(0) as unknown as Buffer,
        },
        executable: false,
        lamports: 0,
        owner: new PublicKey('11111111111111111111111111111111'),
        pubkey: new PublicKey('JEKNVWWk5oPzAawWu1BKDS4s11PMvnQ9scDCvRa7eSuf'),
        space: 0,
    };
}

export function getNftData(): NFTData {
    return {
        editionInfo: {},
        metadata: {
            data: {
                name: 'USD Coin',
                sellerFeeBasisPoints: 0,
                symbol: 'USDC',
                uri: '',
            },
            editionNonce: 252,
            isMutable: 1,
            key: 4,
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            primarySaleHappened: 0,
            updateAuthority: '2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9',
        },
    } as unknown as NFTData; // NFTData type is incomplete and incorrect for some fields, fixing it would require a lot of unrelated changes
}

export function getTokenExtension(): TokenExtension[] {
    return [
        {
            extension: 'mintCloseAuthority',
            state: {
                closeAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
        },
        {
            extension: 'permanentDelegate',
            state: {
                delegate: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
            },
        },
        {
            extension: 'transferFeeConfig',
            state: {
                newerTransferFee: {
                    epoch: 605,
                    maximumFee: 0,
                    transferFeeBasisPoints: 0,
                },
                olderTransferFee: {
                    epoch: 605,
                    maximumFee: 0,
                    transferFeeBasisPoints: 0,
                },
                transferFeeConfigAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                withdrawWithheldAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                withheldAmount: 0,
            },
        },
        {
            extension: 'confidentialTransferMint',
            state: {
                auditorElgamalPubkey: null,
                authority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                autoApproveNewAccounts: false,
            },
        },
        {
            extension: 'confidentialTransferFeeConfig',
            state: {
                authority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                harvestToMintEnabled: true,
                withdrawWithheldAuthorityElgamalPubkey: 'HDfmQztzBN2Cc3rkDZuL88SfWw5sSajVMyiz5QaQHFc=',
                withheldAmount:
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
            },
        },
        {
            extension: 'transferHook',
            state: {
                authority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                programId: null,
            },
        },
        {
            extension: 'metadataPointer',
            state: {
                authority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                metadataAddress: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
            },
        },
        {
            extension: 'tokenMetadata',
            state: {
                additionalMetadata: [],
                mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
                name: 'PayPal USD',
                symbol: 'PYUSD',
                updateAuthority: '2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk',
                uri: 'https://token-metadata.paxos.com/pyusd_metadata/prod/solana/pyusd_metadata.json',
            },
        },
    ];
}
