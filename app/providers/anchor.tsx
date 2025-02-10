import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as elfy from 'elfy';
import pako from 'pako';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';

import { formatIdl } from '../utils/convertLegacyIdl';
import { useAccountInfo, useFetchAccountInfo } from './accounts';

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

function getProvider(url: string) {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

function getProgram(idl: Idl, programAddress: string, url: string) {
    const provider = getProvider(url);

    try {
        try {
            // Try using the uploaded IDL
            return new Program(idl, provider);
        } catch (e) {
            // If raw IDL fails, try with formatted IDL
            try {
                const unprunedIdl = formatIdl(idl, programAddress, false);
                return new Program(unprunedIdl, provider);
            } catch (e) {
                // Try again with types removed
                const prunedIdl = formatIdl(idl, programAddress, true);
                return new Program(prunedIdl, provider);
            }
        }
    } catch (e) {
        console.error('Error creating anchor program for', programAddress, e, { idl });
        return null;
    }
}

export function useAnchorProgram(programAddress: string, url: string): { program: Program | null; idl: Idl | null } {
    const { data } = useSWR([programAddress, url], async () => {
        try {
            const programId = new PublicKey(programAddress);
            const idl = await Program.fetchIdl<Idl>(programId, getProvider(url));
            if (!idl) {
                throw new Error(`IDL not found for program: ${programAddress}`);
            }
            return { idl, program: getProgram(idl, programAddress, url) };
        } catch (e) {
            console.error('Error fetching IDL:', e);
            return null;
        }
    });

    return data ?? { idl: null, program: null };
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
