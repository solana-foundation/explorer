import { isSolanaError, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, SolanaErrorCode } from '@solana/kit';
import { NextResponse } from 'next/server';

import { errors, getMetadataEndpointUrl, getProgramCanonicalMetadata } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

const EXPECTED_SOLANA_ERRORS: SolanaErrorCode[] = [SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    const seed = searchParams.get('seed');

    if (!programAddress || !clusterProp || !seed) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const url = getMetadataEndpointUrl(Number(clusterProp));
    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    try {
        const programMetadata = await getProgramCanonicalMetadata(programAddress, seed, url);

        return NextResponse.json(
            { programMetadata },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    } catch (error) {
        // Handle expected Solana errors (like metadata not found) gracefully
        if (error instanceof Error && isExpectedSolanaError(error)) {
            // Return null IDL if error is expected
            return NextResponse.json(
                { programMetadata: null },
                {
                    headers: CACHE_HEADERS,
                    status: 200,
                }
            );
        } else if (error instanceof Error && error.cause) {
            // Log extra data if cause is present
            Logger.error(new Error('[api:program-metadata-idl] Request failed', { cause: error.cause }));
        }

        if (error instanceof Error && isSolanaError(error)) {
            Logger.error(error);
        } else {
            Logger.error(new Error('[api:program-metadata-idl] Request failed', { cause: error }));
        }

        return NextResponse.json({ error: errors[500] }, { status: 502 });
    }
}

/**
 * Check that provided error is a proper SolanaError and has the specific code
 */
function isExpectedSolanaError(error: Error) {
    let result = false;
    EXPECTED_SOLANA_ERRORS.forEach(errorCode => {
        if (isSolanaError<typeof errorCode>(error) && error.context.__code === errorCode) {
            result = true;
            return;
        }
    });

    return result;
}
