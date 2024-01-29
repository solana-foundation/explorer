import { base64 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { createEmitInstruction, TokenMetadata, unpack as deserializeTokenMetadata } from '@solana/spl-token-metadata';
import { useConnection } from '@solana/wallet-adapter-react';
import { Connection, MessageV0, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useMemo, useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { useMintAccountInfo } from '@/app/providers/accounts';

import { Address } from '../common/Address';

export enum LoadingState {
    Idle,
    Loading,
    MintMissing,
    MetadataExtensionMissing,
    MetadataAccountMissing,
    MetadataFound,
}

function SplTokenMetadata({ metadata }: { metadata: TokenMetadata }) {
    return (
        <>
            <tr>
                <td>Update Authority</td>
                <td>
                    {metadata.updateAuthority ? (
                        <Address pubkey={new PublicKey(metadata.updateAuthority.toString())} link />
                    ) : (
                        'None'
                    )}
                </td>
            </tr>
            <tr>
                <td>Name</td>
                <td>{metadata.name}</td>
            </tr>
            <tr>
                <td>Symbol</td>
                <td>{metadata.symbol}</td>
            </tr>
            <tr>
                <td>Uri</td>
                <td>{metadata.uri}</td>
            </tr>
            {metadata.additionalMetadata.map(([key, value], idx) => {
                return (
                    <tr key={idx}>
                        <td>{key}</td>
                        <td>{value}</td>
                    </tr>
                );
            })}
        </>
    );
}

async function getTokenMetadata(connection: Connection, programId: PublicKey, metadataPointer: PublicKey) {
    const ix = createEmitInstruction({ metadata: metadataPointer, programId });
    const message = MessageV0.compile({
        instructions: [ix],
        // Use toly.sol's key as the payer key for the simulated transaction
        payerKey: new PublicKey('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY'),
        recentBlockhash: (await connection.getLatestBlockhashAndContext()).value.blockhash,
    });

    const tx = new VersionedTransaction(message);
    const result = await connection.simulateTransaction(tx, {
        commitment: 'confirmed',
        replaceRecentBlockhash: true,
        sigVerify: false,
    });

    if (result.value.returnData) {
        const buffer = base64.decode(result.value.returnData.data[0]);
        return deserializeTokenMetadata(buffer);
    }
    return null;
}

export function useTokenMetadata(mint: string) {
    const { connection } = useConnection();

    const mintInfo = useMintAccountInfo(mint);

    let initialLoadingState = LoadingState.Idle;
    if (!mintInfo || !(mintInfo as any).extensions) {
        initialLoadingState = LoadingState.MintMissing;
    }
    const extensions = (mintInfo as any).extensions;
    const metadataPointerExt = extensions.find((ext: any) => ext.extension === 'metadataPointer');

    if (!metadataPointerExt) {
        initialLoadingState = LoadingState.MetadataExtensionMissing;
    }
    const metadataPointer = metadataPointerExt.state.metadataAddress;
    const metadataAuthority = metadataPointerExt.state.authority;

    const [loading, setLoading] = useState<LoadingState>(initialLoadingState);
    const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
    const [programOwner, setProgramOwner] = useState<PublicKey | null>(null);

    // Use cached data from the mint account if possible
    if (metadataPointer === mint) {
        const tokenMetadataExt = (mintInfo as any).extensions.find((ext: any) => ext.extension === 'tokenMetadata');
        if (tokenMetadataExt) {
            setLoading(LoadingState.MetadataFound);
            const mintMetadata: TokenMetadata = tokenMetadataExt.state;
            setMetadata(mintMetadata);
        }
        setLoading(LoadingState.MetadataExtensionMissing);
    }

    useAsyncEffect(async () => {
        if (metadata) {
            return;
        }

        setLoading(LoadingState.Loading);

        const metadataAccountInfo = await connection.getAccountInfo(new PublicKey(metadataPointer));
        if (!metadataAccountInfo) {
            setLoading(LoadingState.MetadataAccountMissing);
            return;
        }

        setProgramOwner(metadataAccountInfo.owner);
        const tokenMetadata = await getTokenMetadata(
            connection,
            metadataAccountInfo.owner,
            new PublicKey(metadataPointer)
        );

        if (tokenMetadata) {
            setMetadata(tokenMetadata);
            setLoading(LoadingState.MetadataFound);
        } else {
            setLoading(LoadingState.MetadataAccountMissing);
        }
    }, [connection, metadataPointer, metadata]);

    return useMemo(
        () => ({ loading, metadata, metadataAuthority, metadataPointer, programOwner }),
        [loading, metadata, metadataAuthority, metadataPointer, programOwner]
    );
}

export function SplTokenMetadataInterfaceCard({ mint }: { mint: string }) {
    const { loading, metadata, metadataAuthority, metadataPointer, programOwner } = useTokenMetadata(mint);

    const metadataCard = useMemo(() => {
        return (
            <>
                {loading === LoadingState.MetadataAccountMissing ? (
                    'Metadata account has no data'
                ) : loading === LoadingState.MetadataExtensionMissing ? (
                    'Metadata extension missing'
                ) : loading === LoadingState.MetadataFound ? (
                    metadata ? (
                        <SplTokenMetadata metadata={metadata} />
                    ) : (
                        mint
                    )
                ) : (
                    'Loading'
                )}
            </>
        );
    }, [metadata, loading, mint]);

    const card = useMemo(() => {
        return (
            <div className="card">
                <div className="table-responsive mb-1">
                    <table className="table table-sm table-nowrap card-table">
                        <thead>
                            <tr>
                                <th className="text-muted w-1">Field</th>
                                <th className="text-muted w-1">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Program</td>
                                <td>{programOwner ? <Address pubkey={programOwner} link /> : 'Missing'}</td>
                            </tr>
                            <tr>
                                <td>Metadata Address</td>
                                <td>
                                    {metadataPointer ? (
                                        <Address pubkey={new PublicKey(metadataPointer)} link />
                                    ) : (
                                        'Missing'
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td>Metadata Authority</td>
                                <td>
                                    {metadataAuthority ? (
                                        <Address pubkey={new PublicKey(metadataAuthority)} link />
                                    ) : (
                                        'None'
                                    )}
                                </td>
                            </tr>
                            {metadataCard}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }, [metadataAuthority, metadataPointer, metadataCard, programOwner]);

    return card;
}
