import { McpSetupTabs } from './McpSetupTabs';

export function McpSetupSection() {
    return (
        <section id="setup" className="scroll-mt-8">
            <h2 className="mb-2 text-2xl font-bold text-white">Set up your client</h2>
            <p className="mb-6 text-neutral-400">
                The endpoint speaks Streamable HTTP and needs no API key. Pick your client below.
            </p>
            <McpSetupTabs />
        </section>
    );
}
