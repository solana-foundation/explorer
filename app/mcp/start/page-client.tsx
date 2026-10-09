'use client';

import { McpDocsOverviewView } from '@/app/features/mcp-docs';

export default function McpStartPageClient() {
    // Full-bleed dark surface; `-mb-6` cancels the layout's bottom padding so the closing band
    // meets the footer with no gap.
    return (
        <div className="-mb-6 bg-[#0A0E0D]">
            <McpDocsOverviewView />
        </div>
    );
}
