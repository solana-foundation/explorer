import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair } from '@solana/web3.js';
import { useMemo } from 'react';

import { formatIdl } from '../utils/convertLegacyIdl';

const cachedAnchorProgramPromises: Record<
    string,
    void | { __type: 'promise'; promise: Promise<void> } | { __type: 'result'; result: Idl | null }
> = {};

function getProvider(url: string) {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

function useIdlFromAnchorProgramSeed(programAddress: string, url: string): Idl | null {
    const key = `${programAddress}-${url}`;
    const cacheEntry = cachedAnchorProgramPromises[key];

    if (cacheEntry === undefined) {
        const promise = fetch(`/api/codama/anchor?programAddress=${programAddress}&url=${encodeURIComponent(url)}`)
            .then(async result => {
                return result
                    .json()
                    .then(({ idl, error }) => {
                        if (!idl) {
                            throw new Error(error || `IDL not found for program: ${programAddress.toString()}`);
                        }
                        cachedAnchorProgramPromises[key] = {
                            __type: 'result',
                            result: idl,
                        };
                    })
                    .catch(_ => {
                        cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
                    });
            })
            .catch(_ => {
                cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
            });
        cachedAnchorProgramPromises[key] = {
            __type: 'promise',
            promise,
        };
        throw promise;
    } else if (cacheEntry.__type === 'promise') {
        throw cacheEntry.promise;
    }
    return cacheEntry.result;
}

export function useAnchorProgram(programAddress: string, url: string): { program: Program | null; idl: Idl | null } {
    // TODO(ngundotra): Rewrite this to be more efficient
    // const idlFromBinary = useIdlFromSolanaProgramBinary(programAddress);
    const idlFromAnchorProgram = useIdlFromAnchorProgramSeed(programAddress, url);
    const idl = idlFromAnchorProgram;
    const program: Program<Idl> | null = useMemo(() => {
        if (!idl) return null;
        try {
            const program = new Program(formatIdl(idl, programAddress), getProvider(url));
            return program;
        } catch (e) {
            console.error('Error creating anchor program for', programAddress, e, { idl });
            return null;
        }
    }, [idl, programAddress, url]);
    return { idl, program };
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
