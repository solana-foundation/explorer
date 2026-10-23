'use client';

import { Idl, Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { type SupportedIdl } from '../../lib/types';
import { formatSerdeIdl, getFormattedIdl } from '../formatters/format';
import { getIdlSpecType } from '../idl-spec';
import { useProgramIdls } from '../use-program-idls';
import { getProvider } from './anchor-provider';

export function useAnchorProgram(
    programAddress: string,
    url: string,
    cluster?: Cluster,
): { program: Program | null; idl: SupportedIdl | null; isLoading: boolean } {
    const { anchorIdl, isLoading } = useProgramIdls(programAddress, url, cluster ?? Cluster.MainnetBeta);
    const idl: SupportedIdl | null = anchorIdl ?? null;
    const program: Program<Idl> | null = useMemo(() => {
        if (!idl || getIdlSpecType(idl) === 'codama') return null;

        try {
            return new Program(getFormattedIdl(formatSerdeIdl, idl as Idl, programAddress), getProvider(url));
        } catch (e) {
            Logger.error(new Error('[idl] Error creating anchor program', { cause: e }), { idl, programAddress });
            return null;
        }
    }, [idl, programAddress, url]);

    return { idl, isLoading, program };
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
