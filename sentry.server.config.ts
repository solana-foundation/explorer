// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1,

    // Enable logs to be sent to Sentry
    enableLogs: true, // eslint-disable-line  sort-keys-fix/sort-keys-fix

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false, // eslint-disable-line  sort-keys-fix/sort-keys-fix

    environment: process.env.NODE_ENV,
});
