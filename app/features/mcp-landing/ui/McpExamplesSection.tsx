import { BaseCard } from '@/app/shared/ui/Card';

const EXAMPLES: readonly string[] = [
    'Inspect SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf — does it have a verified build and a published IDL?',
    'What are the mint authority, supply and decimals of EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v?',
    'Walk me through this transaction signature instruction by instruction, including inner instructions.',
    'Which Token-2022 extensions are enabled on this mint, and who can still change them?',
];

export function McpExamplesSection() {
    return (
        <section id="examples" className="scroll-mt-8">
            <h2 className="mb-2 text-2xl font-bold text-white">Example requests</h2>
            <p className="mb-6 text-neutral-400">Things worth asking once the server is connected.</p>
            <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
                {EXAMPLES.map(example => (
                    <li key={example}>
                        <BaseCard variant="tight" className="h-full">
                            <p className="m-0 p-5 text-sm text-neutral-300">{example}</p>
                        </BaseCard>
                    </li>
                ))}
            </ul>
        </section>
    );
}
