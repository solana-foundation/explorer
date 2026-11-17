import { isDigits } from '@shared/lib/digits';
import { define } from 'superstruct';

const isIPv4 = (hostname: string) => hostname.split('.').every(isDigits);

const hasValidLabels = (hostname: string) =>
    hostname.includes('.') &&
    !hostname.startsWith('.') &&
    !hostname.endsWith('.') &&
    !hostname.includes('..') &&
    !isIPv4(hostname);

export const Domain = define<string>('Domain', value => {
    if (typeof value !== 'string') return false;
    try {
        const { hostname } = new URL(`https://${value}`);
        return hostname === value.toLowerCase() && hasValidLabels(hostname);
    } catch {
        return false;
    }
});
