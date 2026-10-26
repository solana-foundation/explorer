import { Program } from '@coral-xyz/anchor';

import { type AnchorIdl } from '../../lib/types';
import { formatSerdeIdl } from '../formatters/format';
import { getProvider } from './anchor-provider';

export function buildAnchorProgram(idl: AnchorIdl, programAddress: string, url: string): Program {
    return new Program(formatSerdeIdl(idl, programAddress), getProvider(url));
}
