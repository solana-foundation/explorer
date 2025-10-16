import { isSolanaError, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, SolanaErrorCode } from '@solana/kit';
import { NextResponse } from 'next/server';

import { errors, getProgramMetadataIdl } from '@/app/components/instruction/codama/getProgramMetadataIdl';
import { normalizeUnknownError } from '@/app/shared/unknown-error';
import { Cluster } from '@/app/utils/cluster';
import Logger from '@/app/utils/logger';

import { getMetadataEndpointUrl } from './feature/endpoints';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

const EXPECTED_SOLANA_ERRORS: SolanaErrorCode[] = [SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND];

function isExpectedSolanaError(error: Error) {
    let result = false;
    EXPECTED_SOLANA_ERRORS.forEach(errorCode => {
        if (isSolanaError<typeof errorCode>(error)) {
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

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const cluster: Cluster = Number(clusterProp);
    const url = getMetadataEndpointUrl(cluster);

    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    try {
        const codamaIdl = await getProgramMetadataIdl(programAddress, url, cluster);

        return NextResponse.json(
            { codamaIdl },
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
                { codamaIdl: null },
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
