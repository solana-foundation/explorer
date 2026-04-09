export function getSafeExternalUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    try {
        const url = new URL(trimmedValue);
        return ['http:', 'https:'].includes(url.protocol) ? trimmedValue : null;
    } catch {
        return null;
    }
}

export function isSafeExternalUrl(value: unknown): value is string {
    return getSafeExternalUrl(value) !== null;
}
