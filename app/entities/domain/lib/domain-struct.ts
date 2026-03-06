import { define } from 'superstruct';

const hasValidLabels = (hostname: string) =>
    hostname.includes('.') && !hostname.startsWith('.') && !hostname.endsWith('.') && !hostname.includes('..');

export const Domain = define<string>('Domain', (value) => {
    if (typeof value !== 'string') return false;
    try {
        const { hostname } = new URL(`http://${value}`);
        return hostname === value.toLowerCase() && hasValidLabels(hostname);
    } catch {
        return false;
    }
});
