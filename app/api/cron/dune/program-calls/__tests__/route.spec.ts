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

// Mock Dune client
const mockGetLatestResult = vi.fn();
vi.mock('@duneanalytics/client-sdk', () => {
    return {
        DuneClient: vi.fn().mockImplementation(() => ({ getLatestResult: mockGetLatestResult })),
    };
});

// Mock program metadata helpers to keep name resolution deterministic
vi.mock('@/app/components/instruction/codama/getProgramMetadataIdl', () => ({
    fetchProgramMetadataIdl: vi.fn().mockResolvedValue(null),
    programNameFromIdl: vi.fn().mockReturnValue(undefined),
}));

// Mock programs map
vi.mock('@/app/utils/programs', () => ({ PROGRAM_INFO_BY_ID: {} }));

// Mock DB transaction and tables
const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('@/src/db/drizzle', () => {
    return {
        db: {
            transaction: vi.fn(async (cb: any) => {
                const tx = {
                    delete: () => ({ execute: mockExecute }),
                    insert: () => ({ values: () => ({ execute: mockExecute }) }),
                } as any;
                await cb(tx);
            }),
        },
    };
});

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
    process.env.DUNE_API_KEY = 'dummy';
    process.env.DUNE_PROGRAM_CALLS_MV_ID = '12345';
    mockGetLatestResult.mockReset();
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

describe('GET /api/cron/dune/program-calls', () => {
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

    it('ingests rows and returns ok true', async () => {
        mockGetLatestResult.mockResolvedValueOnce({
            result: {
                rows: [
                    {
                        address: 'Caller1',
                        calls_number: 42,
                        program_address: 'Prog1',
                        program_description: 'desc',
                        program_name: 'fallbackName',
                    },
                ],
            },
        });

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(mockGetLatestResult).toHaveBeenCalledWith({ queryId: 12345 });
    });

    it('handles Dune API errors gracefully', async () => {
        mockGetLatestResult.mockRejectedValueOnce(new Error('Dune API error'));

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(500);
    });

    it('handles database transaction errors gracefully', async () => {
        mockGetLatestResult.mockResolvedValueOnce({
            result: { rows: [] },
        });

        // Mock db transaction to throw error
        const { db } = await import('@/src/db/drizzle');
        (db.transaction as any).mockRejectedValueOnce(new Error('DB error'));

        const { GET } = await importRoute();
        const res = await GET();
        expect(res.status).toBe(500);
    });
});

describe('Environment variable validation', () => {
    it('throws error when CRON_SECRET is missing', async () => {
        delete process.env.CRON_SECRET;
        vi.resetModules();

        await expect(importRoute()).rejects.toThrow();
    });

    it('throws error when DUNE_API_KEY is missing', async () => {
        delete process.env.DUNE_API_KEY;
        vi.resetModules();

        await expect(importRoute()).rejects.toThrow();
    });

    it('throws error when DUNE_PROGRAM_CALLS_MV_ID is missing', async () => {
        delete process.env.DUNE_PROGRAM_CALLS_MV_ID;
        vi.resetModules();

        await expect(importRoute()).rejects.toThrow();
    });
});
