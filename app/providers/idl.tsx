import { Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import * as elfy from 'elfy';
import pako from 'pako';
import { useMemo } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';

import { useAccountInfo, useFetchAccountInfo } from './accounts';
import { fetchIdlFromMetadataProgram } from './program-metadata';

export function useIdlFromMetadataProgram(programAddress: string, url: string, useSuspense = true): Idl | null {
    const { data: idl } = useSWR(
        [`program-metadata-idl`, programAddress, url],
        async () => {
            try {
                const connection = new Connection(url);
                return await fetchIdlFromMetadataProgram(programAddress, connection);
            } catch (error) {
                return null;
            }
        },
        {
            revalidateOnFocus: false,
            suspense: useSuspense,
        }
    );

    return idl ?? null;
}

function parseIdlFromElf(elfBuffer: any) {
    const elf = elfy.parse(elfBuffer);
    const solanaIdlSection = elf.body.sections.find((section: any) => section.name === '.solana.idl');
    if (!solanaIdlSection) {
        throw new Error('.solana.idl section not found');
    }

    // Extract the section data
    const solanaIdlData = solanaIdlSection.data;

    // Parse the section data
    solanaIdlData.readUInt32LE(4);
    const ptr = solanaIdlData.readUInt32LE(4);
    const size = solanaIdlData.readBigUInt64LE(8);

    // Get the compressed bytes
    const byteRange = elfBuffer.slice(ptr, ptr + Number(size));

    // Decompress the IDL
    try {
        const inflatedIdl = JSON.parse(new TextDecoder().decode(pako.inflate(byteRange)));
        return inflatedIdl;
    } catch (err) {
        console.error('Failed to decompress data:', err);
        return null;
    }
}

// Unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useIdlFromSolanaProgramBinary(programAddress: string): Idl | null {
    const fetchAccountInfo = useFetchAccountInfo();
    const programInfo = useAccountInfo(programAddress);
    const programDataAddress: string | undefined = programInfo?.data?.data.parsed?.parsed.info['programData'];
    const programDataInfo = useAccountInfo(programDataAddress);

    useEffect(() => {
        if (!programInfo) {
            fetchAccountInfo(new PublicKey(programAddress), 'parsed');
        }
    }, [programAddress, fetchAccountInfo, programInfo]);

    useEffect(() => {
        if (programDataAddress && !programDataInfo) {
            fetchAccountInfo(new PublicKey(programDataAddress), 'raw');
        }
    }, [programDataAddress, fetchAccountInfo, programDataInfo]);

    const param = useMemo(() => {
        if (programDataInfo && programDataInfo.data && programDataInfo.data.data.raw) {
            const offset =
                (programInfo?.data?.owner.toString() ?? '') === 'BPFLoaderUpgradeab1e11111111111111111111111' ? 45 : 0;
            const raw = Buffer.from(programDataInfo.data.data.raw.slice(offset));

            try {
                return parseIdlFromElf(raw);
            } catch (e) {
                return null;
            }
        }
        return null;
    }, [programDataInfo, programInfo]);
    return param;
}
