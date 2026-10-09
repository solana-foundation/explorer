'use client';

import { useRef } from 'react';

import { cn } from '@/app/components/shared/utils';

import { BAND_RULE, GUTTER } from '../lib/mcp-docs-layout';
import { GravityCta } from './GravityCta';

export function ClosingCta() {
    const fieldRef = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={fieldRef}
            className={cn(
                'relative w-full overflow-hidden bg-heavy-metal-900 pb-16 pt-14 sm:pb-20 sm:pt-20',
                GUTTER,
                BAND_RULE,
            )}
            style={{
                backgroundImage: 'radial-gradient(ellipse 60% 85% at 50% 100%, #1DD79B33 0%, #12171600 100%)',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="relative z-[1] mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
                <span className="font-mono text-xs uppercase tracking-widest text-dark-accent">Start now</span>
                <h2 className="m-0 max-w-3xl text-center text-2xl font-normal leading-tight tracking-tight text-dark-foreground sm:text-5xl sm:leading-none sm:tracking-tight">
                    Give your agent the chain, read-only
                </h2>
                <p className="m-0 max-w-xl text-center text-base leading-6 text-heavy-metal-300">
                    One command, no key, nothing that can sign. Works with Claude Code, Cursor, Windsurf, Codex and VS
                    Code.
                </p>
                <div className="flex flex-col items-center gap-2.5 pt-2.5 sm:flex-row sm:gap-3">
                    <GravityCta
                        href="#setup"
                        fieldRef={fieldRef}
                        className="text-base"
                        desktopScope="closingDesktop"
                        dotScale={1 / 1.5}
                        mobileDotScale={0.5}
                        mobilePullScale={0.5}
                        pageBottomGap={0}
                    >
                        Set up your agent
                    </GravityCta>
                </div>
            </div>
        </div>
    );
}
