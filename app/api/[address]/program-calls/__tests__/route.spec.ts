import { afterEach, describe, expect, it, vi } from 'vitest';

// Mocks scoped variables
let mockResultRows: any[] = [];
let capturedLimit: number | undefined;
let capturedOffset: number | undefined;

// Mock schema tables
vi.mock('@/src/db/schema', () => ({
    program_call_stats: {
        address: { name: 'address' },
        calls_number: { name: 'calls_number' },
        createdAt: { name: 'createdAt' },
        description: { name: 'description' },
        name: { name: 'name' },
        program_address: { name: 'program_address' },
    },
    quicknode_stream_cpi_program_calls_mv: {
        callerProgramAddress: { name: 'caller_program_address' },
        callsNumber: { name: 'calls_number' },
        programAddress: { name: 'program_address' },
    },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
    desc: vi.fn().mockReturnValue({}),
    eq: vi.fn().mockReturnValue({}),
    sql: vi.fn().mockImplementation((_: any) => ({ name: 'sql_expression' })),
}));

// Mock drizzle-orm/pg-core
vi.mock('drizzle-orm/pg-core', () => ({
    unionAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue({}) }),
}));

vi.mock('@/src/db/drizzle', () => {
    const createChain = () => ({
        _limit: undefined as number | undefined,
        _offset: undefined as number | undefined,
        _rows: () => mockResultRows,
        as: vi.fn().mockReturnValue({}),
        from: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation((n: number) => {
            capturedLimit = n;
            return createChain();
        }),
        offset: vi.fn().mockImplementation((n: number) => {
            capturedOffset = n;
            return Promise.resolve(mockResultRows);
        }),
        orderBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
    });

    const db = {
        select: vi.fn().mockImplementation(() => createChain()),
    };

    return { db };
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
        expect(res.headers.get('cache-control')).toBe('public, s-maxage=5, stale-while-revalidate=2');

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
