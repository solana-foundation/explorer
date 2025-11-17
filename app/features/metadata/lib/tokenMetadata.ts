import { isTokenProgramData, type ParsedData } from '@/app/providers/accounts';
import type { TokenExtension } from '@/app/validators/accounts/token-extension';

export function extractTokenMetadata(parsedData: ParsedData): Record<string, unknown> | undefined {
    if (!isTokenProgramData(parsedData)) return undefined;
    if (parsedData.parsed.type !== 'mint') return undefined;

    const extensions: TokenExtension[] = parsedData.parsed.info?.extensions ?? [];
    const tokenMetadata = extensions.find(extension => extension.extension === 'tokenMetadata');

    return tokenMetadata?.state;
}

export function hasTokenMetadata(parsedData: ParsedData | undefined): boolean {
    if (!parsedData) return false;
    return Boolean(extractTokenMetadata(parsedData));
}
