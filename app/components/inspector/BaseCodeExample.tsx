import React from 'react';

import { BaseCodeBlock } from '@/app/shared/ui/CodeBlock';

export type CodeExampleLanguage = 'rust' | 'shell' | 'typescript' | 'url';

export function BaseCodeExample({
    code,
    focus,
    language,
}: {
    code: string;
    focus: string;
    language: CodeExampleLanguage;
}) {
    return (
        // The addresses are made up, so the sample has no copy control and its caption says it is illustrative.
        <BaseCodeBlock caption={EXAMPLE_LABEL} code={code} variant="reference" wrap="wrap">
            {code.split('\n').map((line, i) => (
                // Lines of a fixed snippet never reorder, so the index is a stable key.
                <span key={i} className="block" style={wrapIndentStyle(line)}>
                    {language === 'shell' && i === 0 && <span className="select-none opacity-40">$ </span>}
                    {/* An empty block span has no height, so a blank line keeps one space to hold its row. */}
                    {line === '' ? ' ' : renderLine(line, focus)}
                </span>
            ))}
        </BaseCodeBlock>
    );
}

export const EXAMPLE_LABEL = 'Illustrative example';

// Highlighter-style band in Tailwind emerald-400; clone keeps it continuous across wrapped lines.
const UNDERLINE_STYLE: React.CSSProperties = {
    WebkitBoxDecorationBreak: 'clone',
    backgroundImage: 'linear-gradient(transparent 75%, rgba(52, 211, 153, 0.45) 75%)',
    boxDecorationBreak: 'clone',
};

// The snippet is dimmed throughout; only the focus run is lifted to white and underlined.
function renderLine(line: string, focus: string): React.ReactNode {
    const at = line.indexOf(focus);
    if (at === -1) {
        return <span className="opacity-40">{line}</span>;
    }
    return (
        <>
            <span className="opacity-40">{line.slice(0, at)}</span>
            <mark className="bg-transparent p-0 pb-1 text-white" style={UNDERLINE_STYLE}>
                {focus}
            </mark>
            <span className="opacity-40">{line.slice(at + focus.length)}</span>
        </>
    );
}

const WRAP_EXTRA_INDENT = 2;

function wrapIndentStyle(line: string): React.CSSProperties {
    const indent = line.length - line.trimStart().length + WRAP_EXTRA_INDENT;
    return { paddingLeft: `${indent}ch`, textIndent: `-${indent}ch` };
}
