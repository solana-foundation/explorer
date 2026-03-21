 

import { any, Infer, string, type } from 'superstruct';

export type ParsedInfo = Infer<typeof ParsedInfo>;
export const ParsedInfo = type({
    info: any(),
    type: string(),
});
