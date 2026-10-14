import { AGENT_INSTRUCTIONS_SNIPPET, AGENT_INSTRUCTIONS_TARGETS } from '../lib/setup-clients';
import { CodeCard } from './CodeCard';
import { BandIntro } from './NumberedBand';

export function Instructions() {
    return (
        <>
            <BandIntro title="Teach it to reach for the Explorer">
                Teach the agent to reach for the Explorer instead of guessing — add the block below to the instructions
                file your tool reads.
            </BandIntro>
            <CodeCard code={AGENT_INSTRUCTIONS_SNIPPET} label="Agent instructions" collapsible />
            <p className="m-0 text-sm leading-5 text-heavy-metal-300">
                Drop the snippet above into whichever of these your tool reads:
                <span className="mt-1 block font-mono text-sm text-dark-foreground [overflow-wrap:anywhere]">
                    {AGENT_INSTRUCTIONS_TARGETS.map(({ file }) => file).join(' · ')}
                </span>
            </p>
        </>
    );
}
