import type { ComponentType } from 'react';
import { beforeEach, vi } from 'vitest';

export const parsedAccount = { account: undefined as unknown, onNotFound: vi.fn() };

beforeEach(() => {
    parsedAccount.account = undefined;
    parsedAccount.onNotFound.mockClear();
});

export function ParsedAccountRenderer({ renderComponent: Render }: { renderComponent: ComponentType<any> }) {
    return <Render account={parsedAccount.account} onNotFound={parsedAccount.onNotFound} />;
}
