import { Button } from '@/app/components/shared/ui/button';

export function McpHeroSection() {
    return (
        <section>
            <h1 className="mb-4 text-4xl font-bold text-white">Solana on-chain data for coding agents</h1>
            <p className="mb-6 max-w-2xl text-neutral-400">
                Connect your MCP client to the Explorer and let your agent read decoded on-chain state — accounts,
                programs, tokens and transactions — with the same IDL decoding and program enrichments the Explorer
                renders.
            </p>
            {/* Plain anchors, not next/link: a same-page fragment needs no router, so the hero stays a server component. */}
            <div className="flex flex-wrap gap-3">
                <Button asChild variant="accent">
                    <a href="#setup">Set up your client</a>
                </Button>
                <Button asChild variant="outline">
                    <a href="#tools">Browse the tools</a>
                </Button>
            </div>
        </section>
    );
}
