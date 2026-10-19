'use client';

import { Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { type AnchorIdl } from '../../lib/types';
import { formatSerdeIdl, getFormattedIdl } from '../formatters/format';
import { getProvider } from './anchor-provider';

export function useAnchorProgram(idl: AnchorIdl | undefined, programAddress: string, url: string): Program | null {
    return useMemo(() => {
        if (!idl) return null;

        try {
            return new Program(getFormattedIdl(formatSerdeIdl, idl, programAddress), getProvider(url));
        } catch (e) {
            Logger.error(new Error('[idl] Error creating anchor program', { cause: e }), { idl, programAddress });
            return null;
        }
    }, [idl, programAddress, url]);
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
