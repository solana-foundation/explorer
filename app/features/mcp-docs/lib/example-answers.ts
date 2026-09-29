export type AnswerBlock = { kind: 'text'; text: string } | { kind: 'table'; head: string[]; rows: string[][] };

export type McpExample = {
    id: string;
    prompt: string;
    question: string;
    answer: AnswerBlock[];
    tool: string;
};

const TABLE_HEAD_COST = 24;
const TABLE_ROW_COST = 26;

export type RevealedBlock = { block: AnswerBlock; rows: number; text: string; partial: boolean };

export function blockCost(block: AnswerBlock): number {
    return block.kind === 'text' ? block.text.length : TABLE_HEAD_COST + block.rows.length * TABLE_ROW_COST;
}

export function answerCost(blocks: AnswerBlock[]): number {
    return blocks.reduce((sum, block) => sum + blockCost(block), 0);
}

export function revealAnswer(blocks: AnswerBlock[], revealed: number): RevealedBlock[] {
    const shown: RevealedBlock[] = [];
    let consumed = 0;

    for (const block of blocks) {
        const cost = blockCost(block);
        const into = revealed - consumed;
        if (into <= 0) break;

        const partial = into < cost;
        shown.push({
            block,
            partial,
            rows:
                block.kind === 'table'
                    ? partial
                        ? Math.max(0, Math.floor((into - TABLE_HEAD_COST) / TABLE_ROW_COST))
                        : block.rows.length
                    : 0,
            text: block.kind === 'text' ? (partial ? block.text.slice(0, Math.floor(into)) : block.text) : '',
        });

        if (partial) break;
        consumed += cost;
    }

    return shown;
}

export const MCP_EXAMPLES: McpExample[] = [
    {
        answer: [
            {
                kind: 'text',
                text: '"Sent from my Pumpfun App" (App) — Token-2022 mint, 6 decimals, supply 912,905,455.031061, fixed. Only two extensions, and nobody can change either of them:',
            },
            {
                head: ['Extension', 'Current state', 'Who can change it'],
                kind: 'table',
                rows: [
                    ['metadataPointer', 'points at the mint itself', 'authority: null — nobody'],
                    ['tokenMetadata', 'name, symbol, uri; no extra fields', 'updateAuthority: null — nobody'],
                ],
            },
            {
                kind: 'text',
                text: 'Mint and freeze authorities are null too, and the extensions that carry real issuer power — permanentDelegate, transferHook, transferFeeConfig, confidential transfers — are simply absent.',
            },
        ],
        id: 'token-2022',
        prompt: 'Which Token-2022 extensions are enabled on 49nkLrXi…3kTa8pTL, and who can still change them?',
        question:
            'Which Token-2022 extensions are enabled on 49nkLrXi8nCZBVKsShDNasEtPe4Vn1mx9Xbr3kTa8pTL, and who can still change them?',
        tool: 'inspect_entity',
    },
    {
        answer: [
            {
                kind: 'text',
                text: 'Squads Multisig Program (SQDS4ep65T…) — BPF upgradeable-loader program on mainnet-beta.',
            },
            {
                head: ['Field', 'Value'],
                kind: 'table',
                rows: [
                    ['Upgrade authority', 'null — revoked, so the program is frozen'],
                    ['Last deployed', 'slot 302582236'],
                    ['IDL', 'published on-chain via Anchor, served as Codama'],
                ],
            },
            {
                kind: 'text',
                text: 'The verified build matches Squads-Protocol/v4 @ 2a47b4c (signer sqdcVVoTcKZjXU8yPUwKFbGx1Hig1rhbWJQtMRXp2E1), and the embedded security.txt names OtterSec and Neodyme as auditors.',
            },
        ],
        id: 'program',
        prompt: 'Who holds the upgrade authority for this program, and does the verified build match?',
        question:
            'Who holds the upgrade authority for SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf, and does the verified build match?',
        tool: 'inspect_entity',
    },
    {
        answer: [
            {
                kind: 'text',
                text: 'A v0 message, success, finalized at slot 439023338. One signer, fee 5000 lamports, 67,888 CU consumed; 53 accounts, 34 of them pulled in from 5 address lookup tables.',
            },
            {
                kind: 'text',
                text: 'There are no inner instructions anywhere — three invoke [1] lines in the logs and no [2] depth at all.',
            },
            {
                head: ['#', 'Program', 'What it did'],
                kind: 'table',
                rows: [
                    ['1', 'ComputeBudget', 'SetComputeUnitLimit 600,000 — no priority fee'],
                    ['2', 'System', 'transfer 1002 lamports from the signer'],
                    ['3', '8GCr9711…ViXk', '53 accounts, 154 bytes, 67,588 CU — unverified, no IDL, stays raw'],
                ],
            },
            {
                kind: 'text',
                text: 'A 53-account instruction touching Meteora DLMM and PumpSwap issued zero CPIs and still returned success — the consistent read (inference, not proof) is an arbitrage bot that found nothing worth executing.',
            },
        ],
        id: 'transaction',
        prompt: 'Walk me through this signature, including the inner instructions.',
        question:
            'Walk me through 3MVAxtaFp76y23DBd3MdXTEjpzH8zFtVB1HtVdYSKqZPpx1R9gEkDXCF9bX26vkAvyerz2K54eMCFF7cPpkzArM1, including the inner instructions.',
        tool: 'inspect_entity',
    },
    {
        answer: [
            { kind: 'text', text: 'USDC (EPjFWdd5…) — SPL Token mint on mainnet-beta.' },
            {
                head: ['Field', 'Value'],
                kind: 'table',
                rows: [
                    ['Decimals', '6'],
                    ['Supply', '7748676460441051 raw → 7,748,676,460.441051 USDC'],
                    ['Mint authority', 'BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG'],
                ],
            },
            {
                kind: 'text',
                text: 'Supply is variable — the mint authority is present. Freeze authority is 7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar.',
            },
        ],
        id: 'mint',
        prompt: 'What is the supply and decimals of this mint, and is the supply fixed?',
        question:
            'What is the supply and decimals of EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, and is the supply fixed?',
        tool: 'inspect_entity',
    },
];
