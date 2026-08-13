import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { McpHealth } from '../../model/mcp-health';
import { McpStatusIndicator } from '../McpStatusIndicator';

const { checkMcpHealth, error } = vi.hoisted(() => ({ checkMcpHealth: vi.fn(), error: vi.fn() }));

vi.mock('../../model/mcp-health', () => ({ checkMcpHealth }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error } }));

// A fresh provider per render: the indicator's SWR key is module-global and would leak between cases.
function withFreshCache({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>{children}</SWRConfig>;
}

function renderIndicator(health: McpHealth | Promise<never>) {
    checkMcpHealth.mockReturnValue(Promise.resolve(health));
    render(<McpStatusIndicator />, { wrapper: withFreshCache });
}

describe('McpStatusIndicator', () => {
    beforeEach(() => {
        checkMcpHealth.mockReset();
        error.mockReset();
    });

    it('should read as checking until the first probe lands', () => {
        renderIndicator(new Promise(() => undefined) as Promise<never>);

        expect(screen.getByText('Checking')).toBeInTheDocument();
    });

    it('should report the latency once the endpoint answers', async () => {
        renderIndicator({ latencyMs: 42, status: 'ready' });

        expect(await screen.findByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('42 ms')).toBeInTheDocument();
    });

    it('should explain a disabled endpoint instead of only labelling it', async () => {
        renderIndicator({ reason: 'This deployment has the MCP endpoint turned off.', status: 'disabled' });

        expect(await screen.findByText('Disabled')).toBeInTheDocument();
        expect(screen.getByText('This deployment has the MCP endpoint turned off.')).toBeInTheDocument();
    });

    it('should tell the visitor a key is required rather than claiming the endpoint is down', async () => {
        renderIndicator({ reason: 'This deployment requires a bearer key.', status: 'unauthorized' });

        expect(await screen.findByText('Key required')).toBeInTheDocument();
    });

    it('should not render a latency for a non-ready status', async () => {
        renderIndicator({ reason: 'The endpoint could not be reached.', status: 'unreachable' });

        expect(await screen.findByText('Unreachable')).toBeInTheDocument();
        expect(screen.queryByText(text => text.endsWith(' ms'))).not.toBeInTheDocument();
    });

    // A broken tool contract is our bug, so it must reach Sentry rather than read as a network blip.
    it('should report a degraded endpoint to Sentry', async () => {
        renderIndicator({
            cause: { error: { code: -32601 } },
            reason: 'The endpoint answered, but the ping tool did not reply pong.',
            status: 'degraded',
        });

        expect(await screen.findByText('Degraded')).toBeInTheDocument();
        expect(error).toHaveBeenCalledWith(expect.any(Error), { sentry: true });
    });

    it('should not report an ordinary unreachable endpoint to Sentry', async () => {
        renderIndicator({ reason: 'The endpoint could not be reached.', status: 'unreachable' });

        await screen.findByText('Unreachable');
        expect(error).not.toHaveBeenCalled();
    });
});
