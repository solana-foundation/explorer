import { BookOpen, MessageSquare, Terminal, Tool } from 'react-feather';

export const GUTTER = 'px-5 sm:px-8 lg:px-10 xxl:px-14';

export const BAND_RULE = 'border-0 border-t border-solid border-dark-border';

export const MONO_LABEL = 'font-mono text-xs uppercase tracking-widest';

export const SECTIONS = [
    { Icon: Terminal, id: 'setup', kicker: 'Setup' },
    { Icon: BookOpen, id: 'instructions', kicker: 'Instructions' },
    { Icon: Tool, id: 'tools', kicker: 'Tools' },
    { Icon: MessageSquare, id: 'examples', kicker: 'Examples' },
] as const;

export type EndpointStatus = { state: 'checking' | 'ready' | 'disabled'; ms?: number };
