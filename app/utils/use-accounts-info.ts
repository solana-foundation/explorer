import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';

export interface AccountInfo {
    data: Buffer;
    size: number;
}

export function useAccountsInfo(pubkeys: PublicKey[], clusterUrl: string) {
    const [accounts, setAccounts] = useState<Map<string, AccountInfo>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pubkeys.length === 0) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchAccountsInfo = async () => {
            setLoading(true);
            const connection = new Connection(clusterUrl);

            try {
                const infos = await connection.getMultipleAccountsInfo(pubkeys);
                if (cancelled) return;

                const result = new Map<string, AccountInfo>();
                infos.forEach((info, i) => {
                    if (info) {
                        result.set(pubkeys[i].toBase58(), {
                            data: info.data instanceof Buffer ? info.data : Buffer.from(info.data),
                            size: info.data.length,
                        });
                    }
                });
                setAccounts(result);
            } catch (err) {
                console.error('Failed to fetch accounts info', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAccountsInfo();

        return () => {
            cancelled = true;
        };
    }, [pubkeys, clusterUrl]);

    return { accounts, loading };
}
