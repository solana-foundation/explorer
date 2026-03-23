import { define } from 'superstruct';

// eslint-disable-next-line no-restricted-syntax -- IPv4 detection requires matching an all-digits-and-dots pattern; regex is the simplest and fastest approach here
const isIPv4 = (hostname: string) => /^\d+(\.\d+)*$/.test(hostname);

const hasValidLabels = (hostname: string) =>
    hostname.includes('.') &&
    !hostname.startsWith('.') &&
    !hostname.endsWith('.') &&
    !hostname.includes('..') &&
    !isIPv4(hostname);

export const Domain = define<string>('Domain', value => {
    if (typeof value !== 'string') return false;
    try {
        const { hostname } = new URL(`http://${value}`);
        return hostname === value.toLowerCase() && hasValidLabels(hostname);
    } catch {
        return false;
    }
});
