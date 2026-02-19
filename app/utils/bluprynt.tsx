import React from 'react';

import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { decodeAttestation, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from 'sas-lib';

import { useCluster } from '../providers/cluster';
import { Cluster } from './cluster';

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

        let stale = false;

        const checkVerification = async () => {
            setResult({ status: BlupryntStatus.Loading, verified: false });

            try {
                const connection = new Connection(url);
                const accounts = await connection.getProgramAccounts(new PublicKey(SAS_PROGRAM_ID), {
                    filters: [{ memcmp: { offset: 33, bytes: BLUPRYNT_CREDENTIAL } }],
                });

                if (stale) return;

                const verified = accounts.some(account => {
                    try {
                        const decoded = decodeAttestation({
                            address: account.pubkey.toBase58(),
                            data: Uint8Array.from(account.account.data),
                        } as any);
                        const att = (decoded as any).data;

                        if (att.nonce === mintAddress || att.signer === mintAddress || att.tokenAccount === mintAddress) {
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

                setResult({
                    status: verified ? BlupryntStatus.Success : BlupryntStatus.NotFound,
                    verified,
                });
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
