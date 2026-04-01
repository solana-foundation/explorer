type SearchVerificationState = 'challenging' | 'error' | 'idle';

type ChallengeCallback = () => Promise<string>;

type DirectAuthResult = { challengeRequired: true } | { challengeRequired: false; expiresAt: number; token: string };

type VerifySuccessResponse = {
    expiresAt: number;
    token: string;
    valid: boolean;
};

const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAB7KoqMZhzD-s2l9';
const TOKEN_REFRESH_BUFFER_MS = 30_000;
const TOKEN_STORAGE_KEY = 'helius_search_turnstile_jwt';
const SEARCH_AUTH_VERIFY_PATH = '/api/search/auth';

// ─── Module-level state (singleton by nature of the module) ────────────────

let challengeCallback: ChallengeCallback | null = null;
let challengePromise: Promise<void> | null = null;
let jwtToken: string | null = null;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let tokenExpiry: number | null = null;
let verificationState: SearchVerificationState = 'idle';
let initialized = false;

const listeners = new Set<(state: SearchVerificationState) => void>();

// ─── Initialization ────────────────────────────────────────────────────────

function initFromStorage() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return;

    try {
        const parsed = JSON.parse(stored) as { expiry: number; token: string };
        if (parsed.expiry > Date.now()) {
            jwtToken = parsed.token;
            tokenExpiry = parsed.expiry;
            scheduleTokenRefresh();
        } else {
            window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    } catch {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

// ─── Internal helpers ──────────────────────────────────────────────────────

function getToken() {
    if (!jwtToken || !tokenExpiry || tokenExpiry <= Date.now()) return null;
    return jwtToken;
}

function setVerificationState(state: SearchVerificationState) {
    verificationState = state;
    for (const listener of listeners) {
        listener(state);
    }
}

function storeToken(token: string, expiresAt: number) {
    jwtToken = token;
    tokenExpiry = expiresAt;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ expiry: expiresAt, token }));
    }

    scheduleTokenRefresh();
}

function clearStoredToken() {
    jwtToken = null;
    tokenExpiry = null;

    if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
    }

    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

function scheduleTokenRefresh() {
    if (!tokenExpiry) return;

    if (refreshTimeout) clearTimeout(refreshTimeout);

    const refreshDelay = tokenExpiry - Date.now() - TOKEN_REFRESH_BUFFER_MS;
    if (refreshDelay <= 0) return;

    refreshTimeout = setTimeout(() => {
        acquireNewToken(true).catch(() => clearStoredToken());
    }, refreshDelay);
}

function normalizeExpiry(expiresAt: number) {
    return expiresAt < 10_000_000_000 ? expiresAt * 1_000 : expiresAt;
}

function isVerifySuccessResponse(data: unknown): data is VerifySuccessResponse {
    if (!data || typeof data !== 'object') return false;
    const c = data as Partial<VerifySuccessResponse>;
    return typeof c.token === 'string' && typeof c.expiresAt === 'number' && c.valid === true;
}

async function parseVerifyResponse(response: Response) {
    const data = await response.json();
    if (!isVerifySuccessResponse(data)) throw new Error('Invalid auth response');
    return { expiresAt: normalizeExpiry(data.expiresAt), token: data.token };
}

async function requestDirectAuth(): Promise<DirectAuthResult> {
    const response = await fetch(SEARCH_AUTH_VERIFY_PATH, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });

    if (response.status === 430) return { challengeRequired: true };

    if (response.status === 403) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (data?.error === 'challenge_required') return { challengeRequired: true };
        throw new Error(`Search auth failed: ${response.status}`);
    }

    if (!response.ok) throw new Error(`Search auth failed: ${response.status}`);

    return { challengeRequired: false, ...(await parseVerifyResponse(response)) };
}

async function exchangeTurnstileForJwt(turnstileToken: string) {
    const response = await fetch(SEARCH_AUTH_VERIFY_PATH, {
        headers: { 'Content-Type': 'application/json', 'X-Turnstile-Token': turnstileToken },
        method: 'POST',
    });

    if (!response.ok) throw new Error(`Turnstile verification failed: ${response.status}`);

    return parseVerifyResponse(response);
}

async function acquireNewToken(forceRefresh = false) {
    try {
        const directAuth = await requestDirectAuth();
        if (!directAuth.challengeRequired) {
            storeToken(directAuth.token, directAuth.expiresAt);
            if (!forceRefresh) setVerificationState('idle');
            return;
        }

        if (forceRefresh) {
            clearStoredToken();
            return;
        }

        if (!challengeCallback) throw new Error('Turnstile challenge callback is not registered');

        setVerificationState('challenging');
        const turnstileToken = await challengeCallback();
        const verified = await exchangeTurnstileForJwt(turnstileToken);
        storeToken(verified.token, verified.expiresAt);
        setVerificationState('idle');
    } catch (error) {
        if (!forceRefresh) {
            setVerificationState('error');
            setTimeout(() => {
                if (verificationState === 'error') setVerificationState('idle');
            }, 3_000);
        }
        throw error;
    }
}

async function ensureValidToken() {
    initFromStorage();
    if (getToken()) return;
    challengePromise ??= acquireNewToken().finally(() => {
        challengePromise = null;
    });
    await challengePromise;
}

async function forceNewToken() {
    clearStoredToken();
    await ensureValidToken();
}

async function responseRequiresNewToken(response: Response) {
    if (response.status === 430) return true;
    if (![401, 403].includes(response.status)) return false;

    const data = (await response
        .clone()
        .json()
        .catch(() => null)) as { error?: string; requiresTurnstile?: boolean } | null;

    if (!data) return false;

    const err = data.error?.toLowerCase() ?? '';
    return (
        data.requiresTurnstile === true ||
        err.includes('authentication required') ||
        err.includes('challenge_required') ||
        err.includes('invalid or expired') ||
        err.includes('token')
    );
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getHeliusSearchTurnstileSiteKey() {
    return process.env.NEXT_PUBLIC_HELIUS_SEARCH_TURNSTILE_SITE_KEY ?? DEFAULT_TURNSTILE_SITE_KEY;
}

export function getSearchVerificationState() {
    return verificationState;
}

export function registerSearchChallengeCallback(callback: ChallengeCallback) {
    challengeCallback = callback;
}

export function subscribeToSearchStateChanges(listener: (state: SearchVerificationState) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export async function fetchWithHeliusSearchAuth(input: RequestInfo | URL, init?: RequestInit) {
    await ensureValidToken();

    const makeHeaders = () => {
        const headers = new Headers(init?.headers);
        const token = getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return headers;
    };

    const response = await fetch(input, { ...init, headers: makeHeaders() });
    if (response.ok || !(await responseRequiresNewToken(response))) return response;

    await forceNewToken();
    return fetch(input, { ...init, headers: makeHeaders() });
}

export type { SearchVerificationState };
