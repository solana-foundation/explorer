import { vi } from 'vitest';

// Stable identities, as the real hooks give: a new router per render re-runs every effect that depends on it.
const router = { push: vi.fn(), replace: vi.fn() };
const searchParams = new URLSearchParams();

export const usePathname = vi.fn(() => '/');
export const useRouter = vi.fn(() => router);
export const useSearchParams = vi.fn(() => searchParams);
