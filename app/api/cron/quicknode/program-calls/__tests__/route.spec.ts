import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/headers to provide Authorization
const mockHeaders = {
    get: vi.fn((key: string) => {
        if (key.toLowerCase() === 'authorization') {
            return `Bearer test-secret`;
        }
        return null;
    }),
};

vi.mock('next/headers', () => {
    return {
        headers: vi.fn().mockReturnValue(mockHeaders),
    };
});

// Mock DB execute
const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('@/src/db/drizzle', () => {
    return {
        db: {
            execute: mockExecute,
        },
    };
});

// Mock drizzle-orm sql function
vi.mock('drizzle-orm', () => ({
    sql: vi.fn().mockImplementation((_: any) => ({
        text: 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.quicknode_stream_cpi_program_calls_mv;',
    })),
}));

// Mock error response helper
vi.mock('@/app/api/shared/errors', () => ({
    respondWithError: vi.fn((status: number) => new Response(JSON.stringify({ error: 'Test error' }), { status })),
}));

// Mock logger
vi.mock('@/app/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}));

async function importRoute() {
    return await import('../route');
}

beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    mockExecute.mockReset();
    // Reset the headers mock to default behavior
    vi.mocked(mockHeaders.get).mockImplementation((key: string) => {
        if (key.toLowerCase() === 'authorization') {
            return `Bearer test-secret`;
        }
        return null;
    });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/cron/quicknode/program-calls', () => {
    it('rejects when unauthorized', async () => {
        // Override header mock for this test to return wrong token
        const { headers } = await import('next/headers');
        (headers as any).mockReturnValueOnce({
            get: (key: string) => {
                if (key.toLowerCase() === 'authorization') {
                    return 'Bearer wrong';
                }
                return null;
            },
        });

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('refreshes materialized view and returns ok true', async () => {
        mockExecute.mockResolvedValueOnce(undefined);

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(mockExecute).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.quicknode_stream_cpi_program_calls_mv;',
            })
        );
    });

    it('handles database errors gracefully', async () => {
        mockExecute.mockRejectedValueOnce(new Error('Database error'));

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(500);
    });

    it('logs errors when they occur', async () => {
        const Logger = (await import('@/app/utils/logger')).default;
        mockExecute.mockRejectedValueOnce(new Error('Database error'));

        const { GET } = await importRoute();
        await GET();

        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('rejects when authorization header is missing', async () => {
        const { headers } = await import('next/headers');
        (headers as any).mockReturnValueOnce({
            get: (_: string) => null,
        });

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('rejects with malformed authorization header', async () => {
        const { headers } = await import('next/headers');
        (headers as any).mockReturnValueOnce({
            get: (key: string) => {
                if (key.toLowerCase() === 'authorization') {
                    return 'InvalidFormat test-secret';
                }
                return null;
            },
        });

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(401);
    });
});

describe('Environment variable validation', () => {
    it('throws error when CRON_SECRET is missing', async () => {
        delete process.env.CRON_SECRET;
        vi.resetModules();

        await expect(importRoute()).rejects.toThrow('CRON_SECRET must be set in environment variables');
    });
});
