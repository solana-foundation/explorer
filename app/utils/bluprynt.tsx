import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import React from 'react';
import { decodeAttestation, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from 'sas-lib';

import { EVerificationSource } from '../features/token-verification-badge';
import { useCluster } from '../providers/cluster';
import { Cluster } from './cluster';
import { createCacheKey, getFromCache, setToCache } from './token-verification-cache';

export enum BlupryntStatus {
    Success,
    FetchFailed,
    Loading,
    NotFound,
}

export type BlupryntResult = {
    verified: boolean;
    status: BlupryntStatus;
};

const BLUPRYNT_CREDENTIAL = 'FygHgyQWuSHP9ob7Bt64gGrzRsuuxUbnAiKKeZDtCKeQ';

export function useBluprynt(mintAddress?: string): BlupryntResult | undefined {
    const { cluster, url } = useCluster();
    const [result, setResult] = React.useState<BlupryntResult>();

    React.useEffect(() => {
        if (!mintAddress || cluster !== Cluster.MainnetBeta) {
            return;
        }

        const cacheKey = createCacheKey(EVerificationSource.Bluprynt, mintAddress);
        const cached = getFromCache<BlupryntResult>(cacheKey);
        if (cached) {
            setResult(cached);
            return;
        }

        let stale = false;

        const checkVerification = async () => {
            setResult({ status: BlupryntStatus.Loading, verified: false });

            try {
                const connection = new Connection(url);
                const accounts = await connection.getProgramAccounts(new PublicKey(SAS_PROGRAM_ID), {
                    filters: [{ memcmp: { bytes: BLUPRYNT_CREDENTIAL, offset: 33 } }],
                });

                if (stale) return;

                const verified = accounts.some(account => {
                    try {
                        const decoded = decodeAttestation({
                            address: account.pubkey.toBase58(),
                            data: Uint8Array.from(account.account.data),
                        } as any);
                        const att = (decoded as any).data;

                        if (
                            att.nonce === mintAddress ||
                            att.signer === mintAddress ||
                            att.tokenAccount === mintAddress
                        ) {
                            return true;
                        }

                        if (att.data?.length >= 32 && bs58.encode(att.data.slice(0, 32)) === mintAddress) {
                            return true;
                        }

                        return false;
                    } catch {
                        return false;
                    }
                });

                const res: BlupryntResult = {
                    status: verified ? BlupryntStatus.Success : BlupryntStatus.NotFound,
                    verified,
                };

                setToCache(cacheKey, res);
                setResult(res);
            } catch {
                if (!stale) {
                    setResult({ status: BlupryntStatus.FetchFailed, verified: false });
                }
            }
        };

        checkVerification();

        return () => {
            stale = true;
        };
    }, [mintAddress, cluster, url]);

    return result;
}
