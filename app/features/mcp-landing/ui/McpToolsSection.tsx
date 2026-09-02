import { defaultCluster } from '@explorer/entity-inspector';
import type { ReactNode } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { MCP_ENABLED_CLUSTER_NAMES } from '@/app/shared/config/mcp-clusters';
import { BaseCard } from '@/app/shared/ui/Card';
import { BaseCodeBlock } from '@/app/shared/ui/CodeBlock';

// Real mainnet-beta reply for the USDC mint, pasted 2026-08-12 — refresh it if the mint payload fields change.
const SAMPLE_RESPONSE = `{
    "payload": {
        "entity": {
            "kind": "spl-token:mint",
            "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "decimals": 6,
            "freeze_authority": "7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar",
            "is_initialized": true,
            "mint_authority": "BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG",
            "supply": "7902797573976355",
            "supply_type": "variable",
            "token_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
    },
    "errors": []
}`;

const COVERAGE: readonly string[] = [
    'SPL Token and Token-2022 mints, token accounts and multisigs, including parsed Token-2022 extensions.',
    'Programs — upgradeable and legacy-loader — enriched with IDL discovery, verified-build status, security.txt metadata and upgrade-authority multisig.',
    'Stake, vote, nonce, sysvar, config, address lookup table, feature and native program accounts.',
    'Compressed NFTs, nftoken accounts and Solana Attestation Service accounts.',
    'Transactions — signers, fee, status and instructions with inner instructions, decoded through IDL, bundled and raw sources.',
    'Accounts of unrecognised programs, decoded through the owner program’s on-chain IDL when it publishes one.',
];

function Param({ children, name, required }: { children: ReactNode; name: string; required?: boolean }) {
    return (
        <div>
            <dt className="flex flex-wrap items-center gap-2">
                <code className="bg-transparent p-0 font-mono text-sm text-accent">{name}</code>
                <Badge variant={required ? 'default' : 'transparent'}>{required ? 'required' : 'optional'}</Badge>
            </dt>
            <dd className="m-0 mt-1 text-sm text-neutral-400">{children}</dd>
        </div>
    );
}

function Tool({ children, description, name }: { children?: ReactNode; description: string; name: string }) {
    return (
        <BaseCard variant="tight">
            <div className="space-y-4 p-6">
                <div>
                    <h3 className="m-0 font-mono text-base font-medium text-white">{name}</h3>
                    <p className="m-0 mt-2 text-sm text-neutral-400">{description}</p>
                </div>
                {children}
            </div>
        </BaseCard>
    );
}

export function McpToolsSection() {
    return (
        <section id="tools" className="scroll-mt-8">
            <h2 className="mb-2 text-2xl font-bold text-white">Tools</h2>
            <p className="mb-6 text-neutral-400">
                The server registers two tools. Both are read-only — nothing signs, sends or mutates.
            </p>

            <div className="space-y-6">
                <Tool
                    name="inspect_entity"
                    description="Retrieves detailed on-chain data for any Solana address or transaction signature. The tool detects which one it was given."
                >
                    <dl className="m-0 space-y-4">
                        <Param name="identifier" required>
                            A base58 string, 1–128 characters: a 32-byte account address or a 64-byte transaction
                            signature.
                        </Param>
                        <Param name="cluster">
                            One of {MCP_ENABLED_CLUSTER_NAMES.join(', ')}. Defaults to{' '}
                            {defaultCluster(MCP_ENABLED_CLUSTER_NAMES)}.
                        </Param>
                    </dl>

                    <div>
                        <h4 className="m-0 mb-2 text-sm font-medium text-neutral-200">What it covers</h4>
                        <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-neutral-400">
                            {COVERAGE.map(item => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="m-0 mb-2 text-sm font-medium text-neutral-200">Response</h4>
                        <BaseCodeBlock caption="mainnet-beta" code={SAMPLE_RESPONSE} />
                    </div>
                </Tool>

                <Tool name="ping" description="Basic scaffold health tool. Takes no arguments and answers “pong”." />
            </div>
        </section>
    );
}
