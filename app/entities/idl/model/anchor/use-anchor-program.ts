'use client';

import { Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { type AnchorIdl } from '../../lib/types';
import { formatSerdeIdl, getFormattedIdl } from '../formatters/format';
import { type SourcedIdl } from '../idl-candidates';
import { getProvider } from './anchor-provider';

export function useAnchorProgram({
    candidates,
    programAddress,
    select,
    url,
}: {
    candidates: readonly SourcedIdl[] | undefined;
    programAddress: string;
    select: (candidates: readonly SourcedIdl[]) => readonly AnchorIdl[];
    url: string;
}): Program | null {
    return useMemo(() => {
        if (!candidates) return null;

        for (const idl of select(candidates)) {
            const program = buildProgram(idl, programAddress, url);
            if (program) return program;
        }
        return null;
    }, [candidates, programAddress, select, url]);
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
