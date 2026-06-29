/* eslint-disable no-restricted-syntax, no-restricted-globals -- markdown parsing needs regexes */
import { fetchText } from './http';

const SUMMARY_HEADERS = ['Summary', 'Abstract', 'Overview', 'Description'] as const;
const MAX_DESCRIPTION_CHARS = 280;
const BLOB_URL_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

/**
 * Fetch a feature's linked SIMD markdown and extract its summary. Uses the
 * first resolvable `github.com/.../blob/...` link; returns `undefined` when
 * there's no usable link or no Summary-like section.
 */
export async function fetchSimdSummary(simdLinks: string[]): Promise<string | undefined> {
    const blobUrl = simdLinks.find(link => link.length > 0);
    if (blobUrl === undefined) return undefined;
    const rawUrl = toRawUrl(blobUrl);
    if (rawUrl === undefined) return undefined;
    const markdown = await fetchText(rawUrl);
    if (markdown === undefined) return undefined;
    return extractSummary(markdown);
}

/**
 * Convert a `github.com/<owner>/<repo>/blob/<branch>/<path>` URL into the
 * matching `raw.githubusercontent.com` URL. Returns `undefined` for any
 * URL that doesn't fit that pattern.
 */
export function toRawUrl(blobUrl: string): string | undefined {
    const match = BLOB_URL_PATTERN.exec(blobUrl);
    if (!match) return undefined;
    const [, owner, repo, branch, path] = match;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Pull the first paragraph under a Summary-like heading out of a SIMD's
 * markdown body. Returns `undefined` when no suitable section is found.
 */
export function extractSummary(markdown: string): string | undefined {
    const body = stripFrontMatter(markdown);
    for (const header of SUMMARY_HEADERS) {
        const paragraph = firstParagraphAfter(body, header);
        if (paragraph) return condense(paragraph);
    }
    return undefined;
}

function stripFrontMatter(markdown: string): string {
    if (!markdown.startsWith('---')) return markdown;
    const end = markdown.indexOf('\n---', 3);
    if (end === -1) return markdown;
    return markdown.slice(end + '\n---'.length);
}

function firstParagraphAfter(markdown: string, header: string): string | undefined {
    const pattern = new RegExp(`^#{1,4}\\s*${escapeRegex(header)}\\s*$\\n+(?<body>.+?)(?:\\n\\s*\\n|^#{1,4}\\s)`, 'ms');
    const match = pattern.exec(markdown);
    return match?.groups?.body;
}

function condense(paragraph: string): string {
    let text = paragraph.trim();
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/\s+/g, ' ');
    if (text.length > MAX_DESCRIPTION_CHARS) {
        text = `${text.slice(0, MAX_DESCRIPTION_CHARS - 1).trimEnd()}…`;
    }
    return text;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
