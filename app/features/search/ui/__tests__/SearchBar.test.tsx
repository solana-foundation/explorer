import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, type Mock, vi } from 'vitest';

import type { SearchOptions } from '../../lib/types';
import { useSearch } from '../../model/use-search';
import { useSearchNavigation } from '../../model/use-search-navigation';
import { SearchBar } from '../SearchBar';

beforeAll(() => {
    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

vi.mock('../../model/use-search', () => ({ useSearch: vi.fn() }));
vi.mock('../../model/use-search-navigation', () => ({ useSearchNavigation: vi.fn() }));

const mockNavigate = vi.fn();

const tokenResults: SearchOptions[] = [
    {
        label: 'Tokens',
        options: [
            { label: 'Token A', pathname: '/address/tokenA', value: ['token-a'] },
            { label: 'Token B', pathname: '/address/tokenB', value: ['token-b'] },
        ],
    },
];

function setup(results: SearchOptions[] = [], isLoading = false) {
    (useSearch as Mock).mockReturnValue({ data: results, isLoading });
    (useSearchNavigation as Mock).mockReturnValue(mockNavigate);
    const view = render(<SearchBar />);
    return { ...view, userEvent: userEvent.setup() };
}

afterEach(() => {
    vi.clearAllMocks();
});

describe('SearchBar', () => {
    it('should navigate and reset state when a result is selected', async () => {
        const { userEvent: ue } = setup(tokenResults);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'token');

        const item = screen.getByText('Token A');
        await ue.click(item);

        expect(mockNavigate).toHaveBeenCalledWith(tokenResults[0].options[0]);
        expect(input).toHaveValue('');
    });

    it('should call navigate with the correct option for each result', async () => {
        const { userEvent: ue } = setup(tokenResults);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'token');
        await ue.click(screen.getByText('Token B'));

        expect(mockNavigate).toHaveBeenCalledWith(tokenResults[0].options[1]);
    });

    it('should close the popover on Escape', async () => {
        const { userEvent: ue } = setup(tokenResults);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'token');

        // Results should be visible
        expect(screen.getByText('Token A')).toBeInTheDocument();

        await ue.keyboard('{Escape}');

        // Results should be hidden after escape
        expect(screen.queryByText('Token A')).not.toBeInTheDocument();
    });

    it('should clear the input when the clear button is clicked', async () => {
        const { userEvent: ue } = setup(tokenResults);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'token');
        expect(input).toHaveValue('token');

        const clearButton = screen.getByRole('button', { name: 'Clear search' });
        await ue.click(clearButton);

        expect(input).toHaveValue('');
    });

    it('should show "No Results" when search returns empty', async () => {
        const { userEvent: ue } = setup([]);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'xyznonexistent');

        expect(screen.getByText('No Results')).toBeInTheDocument();
    });

    it('should show loading state', async () => {
        const { userEvent: ue } = setup([], true);

        const input = screen.getByRole('combobox');
        await ue.type(input, 'loading');

        expect(screen.getByText('loading...')).toBeInTheDocument();
    });
});
