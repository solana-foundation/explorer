import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MCP_SETUP_CLIENTS } from '../../model/setup-clients';
import { McpSetupTabs } from '../McpSetupTabs';

describe('McpSetupTabs', () => {
    it('should render one tab per supported client', () => {
        render(<McpSetupTabs />);

        expect(screen.getAllByRole('tab')).toHaveLength(MCP_SETUP_CLIENTS.length);
    });

    it('should select the first client by default', () => {
        render(<McpSetupTabs />);

        expect(screen.getByRole('tab', { name: 'Claude Code' })).toHaveAttribute('data-state', 'active');
        expect(
            screen.getByText('claude mcp add --transport http solana-explorer https://explorer.solana.com/mcp'),
        ).toBeInTheDocument();
    });

    it('should swap the visible steps when another client is selected', async () => {
        render(<McpSetupTabs />);

        await userEvent.click(screen.getByRole('tab', { name: 'Windsurf' }));

        expect(screen.getByText('~/.codeium/windsurf/mcp_config.json')).toBeInTheDocument();
        expect(screen.queryByText('.mcp.json')).not.toBeInTheDocument();
    });
});
