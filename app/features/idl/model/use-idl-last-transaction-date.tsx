'use client';

import { useCluster } from '@providers/cluster';
import { address, createSolanaRpc } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchMetadataFromSeeds } from '@solana-program/program-metadata';
import { useEffect, useState } from 'react';

import { IDL_SEED } from '@/app/entities/program-metadata/api/getProgramCanonicalMetadata';

export enum IdlVariant {
    Anchor = 'anchor',
    ProgramMetadata = 'program-metadata',
}

/**
 * Hook to compare timestamps of Anchor and PMP IDLs.
 * Returns which IDL variant should be preferred based on recency.
 *
 * @param programId - The program public key
 * @param hasAnchorIdl - Whether Anchor IDL exists
 * @param hasPmpIdl - Whether PMP IDL exists
 * @returns 'anchor' if Anchor IDL is more recent, 'pmp' if PMP is more recent or as fallback, null if loading
 */
export function useIdlLastTransactionDate(
    programId: string | null,
    hasAnchorIdl: boolean,
    hasPmpIdl: boolean
): IdlVariant {
    const { url } = useCluster();
    const [preferredVariant, setPreferredVariant] = useState<IdlVariant>(IdlVariant.ProgramMetadata);

    useEffect(() => {
        if (!programId) return;

        switch (true) {
            case !hasAnchorIdl && !hasPmpIdl:
                setPreferredVariant(IdlVariant.ProgramMetadata);
                return;
            case hasAnchorIdl && !hasPmpIdl:
                setPreferredVariant(IdlVariant.Anchor);
                return;
            case hasPmpIdl && !hasAnchorIdl:
                setPreferredVariant(IdlVariant.ProgramMetadata);
                return;
        }

        const abortController = new AbortController();

        async function fetchAndCompareTimestamps() {
            if (!programId) return;
            try {
                const connection = new Connection(url);
                const programPubkey = new PublicKey(programId);

                const [anchorTimestamp, pmpTimestamp] = await Promise.race([
                    Promise.all([
                        fetchAnchorIdlTimestamp(connection, programPubkey),
                        fetchPmpIdlTimestamp(connection, programId),
                    ]),
                    new Promise<never>((_, reject) => {
                        abortController.signal.addEventListener('abort', () => reject(new Error('Aborted')));
                    }),
                ]);

                if (anchorTimestamp !== null && pmpTimestamp !== null) {
                    const preferred = anchorTimestamp >= pmpTimestamp ? IdlVariant.Anchor : IdlVariant.ProgramMetadata;
                    setPreferredVariant(preferred);
                } else if (anchorTimestamp !== null) {
                    setPreferredVariant(IdlVariant.Anchor);
                } else {
                    setPreferredVariant(IdlVariant.ProgramMetadata);
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error('[IDL Comparison] Error:', error);
                }
            }
        }

        fetchAndCompareTimestamps();

        return () => {
            abortController.abort();
        };
    }, [programId, url, hasAnchorIdl, hasPmpIdl]);

    return preferredVariant;
}

async function fetchAnchorIdlTimestamp(connection: Connection, programPubkey: PublicKey): Promise<number | null> {
    try {
        const [idlAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from('anchor:idl'), programPubkey.toBuffer()],
            programPubkey
        );

        const signatures = await connection.getSignaturesForAddress(idlAddress, { limit: 1 });

        if (signatures.length > 0 && signatures[0].blockTime) {
            return signatures[0].blockTime;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function fetchPmpIdlTimestamp(connection: Connection, programId: string): Promise<number | null> {
    try {
        const rpc = createSolanaRpc(connection.rpcEndpoint);
        const programAddress = address(programId);

        const metadataAccount = await fetchMetadataFromSeeds(rpc, {
            authority: null,
            program: programAddress,
            seed: IDL_SEED,
        });

        const signatures = await connection.getSignaturesForAddress(new PublicKey(metadataAccount.address), {
            limit: 1,
        });

        if (signatures.length > 0 && signatures[0].blockTime) {
            return signatures[0].blockTime;
        }
        return null;
    } catch (error) {
        return null;
    }
}
