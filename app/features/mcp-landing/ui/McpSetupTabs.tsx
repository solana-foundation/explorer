'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/shared/ui/tabs';
import { CodeBlock } from '@/app/shared/ui/CodeBlock';

import { MCP_SETUP_CLIENTS } from '../model/setup-clients';

export function McpSetupTabs() {
    return (
        <Tabs defaultValue={MCP_SETUP_CLIENTS[0].id}>
            <TabsList className="flex w-full flex-wrap gap-4 border-0 border-b border-solid border-heavy-metal-950">
                {MCP_SETUP_CLIENTS.map(client => (
                    <TabsTrigger key={client.id} value={client.id}>
                        {client.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {MCP_SETUP_CLIENTS.map(client => (
                <TabsContent key={client.id} value={client.id} className="pt-6">
                    {/* Global styles put markers and 2.5rem of padding on every ol — reset both. */}
                    <ol className="m-0 list-none space-y-6 p-0">
                        {client.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-3">
                                <span
                                    aria-hidden
                                    className="bg-accent/10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-accent"
                                >
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <h3 className="m-0 text-sm font-medium text-neutral-200">{step.title}</h3>
                                    {step.description && (
                                        <p className="m-0 text-sm text-neutral-500">{step.description}</p>
                                    )}
                                    {step.snippet && (
                                        <CodeBlock
                                            caption={step.snippet.caption}
                                            code={step.snippet.code}
                                            wrap={step.snippet.wrap}
                                        />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </TabsContent>
            ))}
        </Tabs>
    );
}
