import { headers } from 'next/headers';

const EU_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

export function isEUCountry(countryCode: string | undefined): boolean {
    if (!countryCode) return false;
    return EU_COUNTRIES.includes(countryCode.toUpperCase());
}

export function getIsEU(): boolean {
    try {
        const headersList = headers();
        const country = headersList.get('x-vercel-ip-country');
        return isEUCountry(country || undefined);
    } catch {
        return false;
    }
}
