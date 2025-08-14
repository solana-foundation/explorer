import { afterEach, describe, expect, it, vi } from 'vitest';

// Mocks scoped variables
let mockResultRows: any[] = [];
let capturedLimit: number | undefined;
let capturedOffset: number | undefined;

vi.mock('@/src/db/drizzle', () => {
    const chain: any = {
        _limit: undefined as number | undefined,
        _offset: undefined as number | undefined,
        _rows: () => mockResultRows,
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((n: number) => {
            capturedLimit = n;
            chain._limit = n;
            return chain;
        }),
        offset: vi.fn().mockImplementation((n: number) => {
            capturedOffset = n;
            chain._offset = n;
            return Promise.resolve(chain._rows());
        }),
        orderBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
    };
    return { db: chain };
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

// Import dynamically inside tests so mocks are applied before module load
async function importRoute() {
    return await import('../route');
}

afterEach(() => {
    vi.clearAllMocks();
    mockResultRows = [];
    capturedLimit = undefined;
    capturedOffset = undefined;
});

describe('GET /api/[address]/program-calls', () => {
    it('returns data with provided limit/offset and proper headers', async () => {
        mockResultRows = [
            { address: 'Caller1', calls_number: 10, description: 'Desc1', name: 'Name1', program_address: 'Prog1' },
            { address: 'Caller2', calls_number: 5, description: 'Desc2', name: 'Name2', program_address: 'Prog1' },
        ];

        const { GET } = await importRoute();

        const request = new Request('http://localhost:3000/api/Prog1/program-calls?limit=10&offset=5');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(200);
        expect(res.headers.get('cache-control')).toBe('public, s-maxage=600, stale-while-revalidate=60');

        const data = await res.json();
        expect(data).toEqual(mockResultRows);

        expect(capturedLimit).toBe(10);
        expect(capturedOffset).toBe(5);
    });

    it('applies default limit=50 and offset=0 when not provided', async () => {
        mockResultRows = [];

        const { GET } = await importRoute();

        const request = new Request('http://localhost:3000/api/Prog1/program-calls');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(200);
        expect(capturedLimit).toBe(50);
        expect(capturedOffset).toBe(0);
    });

    it('handles invalid limit parameter gracefully', async () => {
        const { GET } = await importRoute();

        const request = new Request('http://localhost:3000/api/Prog1/program-calls?limit=invalid&offset=0');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(400);
    });

    it('handles invalid offset parameter gracefully', async () => {
        const { GET } = await importRoute();

        const request = new Request('http://localhost:3000/api/Prog1/program-calls?limit=10&offset=invalid');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(400);
    });

    it('handles database errors gracefully', async () => {
        const { GET } = await importRoute();

        // Mock db chain to throw error
        const { db } = await import('@/src/db/drizzle');
        (db.select as any).mockImplementationOnce(() => {
            throw new Error('Database connection failed');
        });

        const request = new Request('http://localhost:3000/api/Prog1/program-calls');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(500);
    });

    it('logs errors when they occur', async () => {
        const { GET } = await importRoute();
        const Logger = (await import('@/app/utils/logger')).default;

        // Mock db chain to throw error
        const { db } = await import('@/src/db/drizzle');
        (db.select as any).mockImplementationOnce(() => {
            throw new Error('Database connection failed');
        });

        const request = new Request('http://localhost:3000/api/Prog1/program-calls');
        await GET(request, { params: { address: 'Prog1' } });

        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error));
    });
});
