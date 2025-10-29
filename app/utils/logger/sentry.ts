export function isSentryEnabled() {
    return process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';
}
