import { parseSecurityTxt } from '@explorer/parsers/security-txt';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { asRecord } from '../shared/parse-helpers.js';
import type { SecurityMetadataResult, SecurityTxtFields } from './types.js';
import { fetchPmpSecurityMetadata } from './pmp-security.js';

export type ResolveSecurityMetadata = (
    programAddress: string,
    programDataRawBase64: string | null,
    cluster: SupportedCluster,
) => Promise<SecurityMetadataResult>;

function joinIfArray(value: unknown): string | null {
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'string') return value;
    return null;
}

function normalizePmpToSecurityTxtFields(raw: Record<string, unknown>): SecurityTxtFields | null {
    const name = typeof raw.name === 'string' ? raw.name : null;
    const project_url = typeof raw.project_url === 'string' ? raw.project_url : null;
    const contacts = joinIfArray(raw.contacts);
    const policy = typeof raw.policy === 'string' ? raw.policy : null;

    if (!name || !project_url || !contacts || !policy) return null;

    return {
        acknowledgements: typeof raw.acknowledgements === 'string' ? raw.acknowledgements : null,
        auditors: joinIfArray(raw.auditors),
        contacts,
        description: typeof raw.description === 'string' ? raw.description : null,
        encryption: typeof raw.encryption === 'string' ? raw.encryption : null,
        expiry: typeof raw.expiry === 'string' ? raw.expiry : null,
        logo: typeof raw.logo === 'string' ? raw.logo : null,
        name,
        notification: typeof raw.notification === 'string' ? raw.notification : null,
        policy,
        preferred_languages: joinIfArray(raw.preferred_languages),
        project_url,
        sdk: typeof raw.sdk === 'string' ? raw.sdk : null,
        source_code: typeof raw.source_code === 'string' ? raw.source_code : null,
        source_release: typeof raw.source_release === 'string' ? raw.source_release : null,
        source_revision: typeof raw.source_revision === 'string' ? raw.source_revision : null,
        version: typeof raw.version === 'string' ? raw.version : null,
    };
}

function isExpired(fields: SecurityTxtFields): boolean {
    if (fields.expiry === null || fields.expiry === undefined) return false;
    const ts = Date.parse(fields.expiry);
    return !Number.isNaN(ts) && ts < Date.now();
}

async function tryPmpSource(
    programAddress: string,
    cluster: SupportedCluster,
    rpcEndpoints: Record<SupportedCluster, string>,
    logger: InspectorLogger,
): Promise<SecurityMetadataResult> {
    let content: string | null;
    try {
        content = await fetchPmpSecurityMetadata(programAddress, cluster, rpcEndpoints);
    } catch (error) {
        logger.warn(ns('security pmp fetch failed'), { error, programAddress });
        return { reason: 'source_unavailable', status: 'unknown' };
    }

    if (content === null) return { status: 'missing' };

    let raw: unknown;
    try {
        raw = JSON.parse(content);
    } catch (error) {
        logger.error(ns('security pmp parse failed'), { error, programAddress });
        return { reason: 'security_invalid', status: 'unknown' };
    }

    const record = asRecord(raw);
    const fields = record ? normalizePmpToSecurityTxtFields(record) : null;
    if (fields === null) return { reason: 'security_invalid', status: 'unknown' };
    return {
        data: fields,
        source_type: 'pmp_canonical',
        status: 'present',
        ...(isExpired(fields) ? { security_expired: true } : {}),
    };
}

function tryEmbeddedSource(rawBase64: string | null): SecurityMetadataResult {
    if (rawBase64 === null) return { status: 'missing' };
    const result = parseSecurityTxt(rawBase64);
    if (result.ok)
        return {
            data: result.fields,
            source_type: 'embedded_security_txt',
            status: 'present',
            ...(isExpired(result.fields) ? { security_expired: true } : {}),
        };
    if (result.error === 'invalid_content') return { reason: 'security_invalid', status: 'unknown' };
    return { status: 'missing' };
}

/** PMP canonical `security` metadata wins; embedded security.txt is the fallback. */
export function createSecurityMetadataResolver(
    rpcEndpoints: Record<SupportedCluster, string>,
    logger: InspectorLogger,
): ResolveSecurityMetadata {
    return async (programAddress, programDataRawBase64, cluster) => {
        const pmp = await tryPmpSource(programAddress, cluster, rpcEndpoints, logger);
        if (pmp.status === 'present') return pmp;

        const embedded = tryEmbeddedSource(programDataRawBase64);
        if (embedded.status === 'present') return embedded;

        if (pmp.status === 'unknown') return pmp;
        if (embedded.status === 'unknown') return embedded;
        return { status: 'missing' };
    };
}
