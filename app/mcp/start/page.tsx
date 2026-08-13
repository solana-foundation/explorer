import type { Metadata } from 'next/types';

import { McpLandingView } from '@/app/features/mcp-landing';

export const metadata: Metadata = {
    description: 'Connect your MCP client to the Solana Explorer for decoded on-chain account and transaction data.',
    title: 'Explorer MCP Server | Solana',
};

export default function McpStartPage() {
    return <McpLandingView />;
}
