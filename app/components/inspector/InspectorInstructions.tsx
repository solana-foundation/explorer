import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { cn } from '@/app/components/shared/utils';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import { TabsContent } from '@/app/shared/ui/Tabs';

import { BaseCodeExample } from './BaseCodeExample';
import {
    EXAMPLE_CLI_COMMAND,
    EXAMPLE_CLI_FOCUS,
    EXAMPLE_ENCODINGS,
    EXAMPLE_SQUADS_URL,
    EXAMPLE_SQUADS_VAULT_TRANSACTION,
    type ExampleEncoding,
    kitExample,
    RUST_ENCODING_CRATE,
    RUST_PRINT_LINE,
    rustExample,
    TS_PRINT_LINES,
} from './inspector-examples';

type TabData = {
    id: string;
    label: string;
    content: React.ReactNode;
};

const INLINE_CODE =
    'inline-block max-w-full rounded bg-heavy-metal-800 my-0.5 px-1.5 py-px align-middle text-neutral-100 [overflow-wrap:anywhere]';

/** The "How to get the input" tabs below the inspector field: one worked example per source. */
export function InspectorInstructions({
    encoding,
    onEncodingChange,
}: {
    encoding: ExampleEncoding;
    onEncodingChange: (encoding: ExampleEncoding) => void;
}) {
    const [activeTab, setActiveTab] = React.useState('cli');
    const rust = rustExample(encoding);
    const kit = kitExample(encoding);
    const ts = TS_PRINT_LINES[encoding];

    const tabs: TabData[] = [
        {
            content: (
                <TabBody
                    instruction={
                        <>
                            Use <code className={INLINE_CODE}>--dump-transaction-message</code> flag
                        </>
                    }
                    example={<BaseCodeExample language="shell" code={EXAMPLE_CLI_COMMAND} focus={EXAMPLE_CLI_FOCUS} />}
                />
            ),
            id: 'cli',
            label: 'CLI',
        },
        {
            content: (
                <TabBody
                    encodingChoice={<EncodingChoice encoding={encoding} onEncodingChange={onEncodingChange} />}
                    instruction={
                        <>
                            Add <code className={INLINE_CODE}>{RUST_ENCODING_CRATE[encoding]}</code> crate dependency
                            and <code className={INLINE_CODE}>{RUST_PRINT_LINE[encoding]}</code>
                        </>
                    }
                    example={<BaseCodeExample language="rust" code={rust.code} focus={rust.focus} />}
                />
            ),
            id: 'rust',
            label: 'Rust',
        },
        {
            content: (
                <TabBody
                    encodingChoice={<EncodingChoice encoding={encoding} onEncodingChange={onEncodingChange} />}
                    instruction={
                        <SnippetGroup
                            // `@solana/web3.js` 2.x was renamed to `@solana/kit` with the same API, so one group covers both.
                            title={['@solana/kit', '@solana/web3.js 2.0.0 and later']}
                            rows={[
                                ['Transaction message:', ts.message],
                                ['Wire transaction:', ts.wire],
                            ]}
                        />
                    }
                    example={<BaseCodeExample language="typescript" code={kit.code} focus={kit.focus} />}
                />
            ),
            id: 'ts',
            label: 'TypeScript',
        },
        {
            content: (
                <TabBody
                    instruction={
                        <>
                            Add <code className={INLINE_CODE}>vault_transaction</code> from{' '}
                            <code className={INLINE_CODE}>
                                https://app.squads.so/squads/&lt;squad_id&gt;/transactions/&lt;vault_transaction&gt;
                            </code>
                        </>
                    }
                    example={
                        <BaseCodeExample
                            language="url"
                            code={EXAMPLE_SQUADS_URL}
                            focus={EXAMPLE_SQUADS_VAULT_TRANSACTION}
                        />
                    }
                    note={
                        <>
                            {/* Same size and weight as the snippet group titles in the TypeScript tab. */}
                            <h3 className="m-0 mb-2 text-sm font-medium text-white">
                                Bringing a transaction into Squads?
                            </h3>
                            <p className="m-0">
                                Squads imports base58 transaction messages. Paste the message here and check it. Then
                                use Download → base58. Import the file content in the Squads TX Builder.
                            </p>
                        </>
                    }
                />
            ),
            id: 'squads',
            label: 'Squads',
        },
    ];

    return (
        <div>
            <h2 className="m-0 mb-1 text-lg font-normal text-white">How to get the input for the field above</h2>
            {/* Styled as the account and block page tab bar, without the sticky behaviour; the underline stays
                within the content column at every width. */}
            <div className="border-0 border-b border-solid border-neutral-800">
                <BaseNavigationTabs
                    tabs={tabs.map(tab => ({ path: tab.id, title: tab.label }))}
                    activeValue={activeTab}
                    buildHref={id => `#${id}`}
                    onTabClick={id => setActiveTab(id)}
                    onSelectChange={setActiveTab}
                    className="gap-5"
                />
            </div>
            <div>
                {tabs.map(tab => (
                    <TabsContent key={tab.id} active={activeTab === tab.id}>
                        {tab.content}
                    </TabsContent>
                ))}
            </div>
        </div>
    );
}

function EncodingChoice({
    encoding,
    onEncodingChange,
}: {
    encoding: ExampleEncoding;
    onEncodingChange: (encoding: ExampleEncoding) => void;
}) {
    return (
        <div role="group" aria-label="Example encoding" className="flex gap-1">
            {EXAMPLE_ENCODINGS.map(value => (
                <Button
                    key={value}
                    variant={value === encoding ? 'default' : 'outline'}
                    size="compact"
                    aria-pressed={value === encoding}
                    className={cn(value === encoding && '!border-accent')}
                    onClick={() => onEncodingChange(value)}
                >
                    {value}
                </Button>
            ))}
        </div>
    );
}

function TabBody({
    encodingChoice,
    instruction,
    example,
    note,
}: {
    encodingChoice?: React.ReactNode;
    instruction: React.ReactNode;
    example: React.ReactNode;
    /** A second case for the same tab, below the example so the instruction stays next to its own example. */
    note?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-6 pt-5">
            {/* The encoding choice sits on its own row above the instruction, so the content keeps one left edge. */}
            {encodingChoice}
            {/* The example belongs to the instruction above it, so it sits at half the gap that separates the note. */}
            <div className="flex flex-col gap-3">
                <div className="text-sm leading-relaxed text-neutral-200">{instruction}</div>
                {example}
            </div>
            {note && <div className="text-sm leading-relaxed text-neutral-200">{note}</div>}
        </div>
    );
}

function SnippetGroup({
    title,
    rows,
}: {
    /** One entry per line. */
    title: string[];
    rows: [label: string, snippet: string][];
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="font-medium text-white">
                {title.map(line => (
                    <div key={line}>{line}</div>
                ))}
            </div>
            {/* Stacked on mobile: a snippet sits closer to its own label than to the next one. Side by side from
                `md`, rows align to the top; the label's `pt-0.5` matches the chip's margin so the first lines line up. */}
            <dl className="m-0 grid gap-x-4 md:grid-cols-[max-content_1fr] md:items-start md:gap-y-2">
                {rows.map(([label, snippet]) => (
                    <React.Fragment key={label}>
                        <dt className="mt-3 font-normal text-outer-space-300 first:mt-0 md:mt-0 md:pt-0.5">{label}</dt>
                        <dd className="m-0 mt-1 md:mt-0">
                            <code className={INLINE_CODE}>{snippet}</code>
                        </dd>
                    </React.Fragment>
                ))}
            </dl>
        </div>
    );
}
