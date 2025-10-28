import { isSolanaError, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, SolanaErrorCode } from '@solana/kit';
import { NextResponse } from 'next/server';

import { getMetadataEndpointUrl } from '@/app/entities/program-metadata/api/getMetadataEndpointUrl';
import { errors, getProgramCanonicalMetadata } from '@/app/entities/program-metadata/api/getProgramCanonicalMetadata';
import { normalizeUnknownError } from '@/app/shared/unknown-error';
import Logger from '@/app/utils/logger';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

const EXPECTED_SOLANA_ERRORS: SolanaErrorCode[] = [SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND];

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
            Logger.error(error.cause);
        }

        let displayError;
        if (error instanceof Error && isSolanaError(error)) {
            // log other errors that are SolanaError to keep track of them
            Logger.error(error);

            // do not show underlying error to preserve existing logic
            displayError = normalizeUnknownError(errors[500]);
        } else {
            displayError = normalizeUnknownError(error);
        }

        return NextResponse.json(
            { details: displayError, error: displayError.message },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    }
}
