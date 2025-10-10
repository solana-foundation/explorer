import { timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';

import Logger from '@/app/utils/logger';

import { respondWithError } from './errors';

const { CRON_SECRET } = process.env;

if (!CRON_SECRET) {
    throw new Error('CRON_SECRET must be set in environment variables');
}

/**
 * Performs constant-time comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies cron job authentication using Bearer token
 */
export function verifyCronAuth(): boolean {
    const headersList = headers();
    const authHeader = headersList.get('Authorization') ?? '';
    const expected = `Bearer ${CRON_SECRET}`;

    return constantTimeCompare(authHeader, expected);
}

/**
 * Middleware to require cron authentication
 * Returns error response if unauthorized
 */
export function requireCronAuth() {
    if (!verifyCronAuth()) {
        Logger.error(new Error('Unauthorized access attempt'));
        return respondWithError(401);
    }
    return null;
}
