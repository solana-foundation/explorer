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
        const [{ label, steps }] = MCP_SETUP_CLIENTS;
        const firstCode = steps.flatMap(step => step.snippet ?? []).at(0)?.code;
        render(<McpSetupTabs />);

        expect(firstCode).toBeDefined();
        expect(screen.getByRole('tab', { name: label })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText(String(firstCode))).toBeInTheDocument();
    });

    it('should swap the visible steps when another client is selected', async () => {
        render(<McpSetupTabs />);

        await userEvent.click(screen.getByRole('tab', { name: 'Windsurf' }));

        expect(screen.getByText('~/.codeium/windsurf/mcp_config.json')).toBeInTheDocument();
        expect(screen.queryByText('.mcp.json')).not.toBeInTheDocument();
    });
});
