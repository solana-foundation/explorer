'use client';

import { Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { type Cluster } from '@/app/utils/cluster';

import { type AnchorIdl } from '../../lib/types';
import { formatSerdeIdl, getFormattedIdl } from '../formatters/format';
import { type SourcedIdl } from '../sourced-idl';
import { useProgramIdls } from '../use-program-idls';
import { getProvider } from './anchor-provider';

export function useAnchorProgram({
    cluster,
    programAddress,
    select,
    url,
}: {
    cluster: Cluster;
    programAddress: string;
    select: (idls: readonly SourcedIdl[]) => readonly AnchorIdl[];
    url: string;
}): { program: Program | null; isLoading: boolean } {
    const { idls } = useProgramIdls(programAddress, url, cluster);
    const program = useMemo(() => {
        if (!idls) return null;

        for (const idl of select(idls)) {
            const built = buildProgram(idl, programAddress, url);
            if (built) return built;
        }
        return null;
    }, [idls, programAddress, select, url]);

    return { isLoading: idls === undefined, program };
}

function buildProgram(idl: AnchorIdl, programAddress: string, url: string): Program | null {
    try {
        return new Program(getFormattedIdl(formatSerdeIdl, idl, programAddress), getProvider(url));
    } catch (e) {
        Logger.error(new Error('[idl] Error creating anchor program', { cause: e }), { idl, programAddress });
        return null;
    }
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
