/**
 * Crawlers kept off the OG image routes, as robots.txt user-agent tokens.
 *
 * Docs:
 * Ahrefs {@link https://ahrefs.com/robot#our-bots}
 * Amazon {@link https://developer.amazon.com/amazonbot}
 * Apple {@link https://support.apple.com/en-us/119829}
 * Google {@link https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers}
 * Meta {@link https://developers.facebook.com/docs/sharing/webmasters/web-crawlers}
 * Petalsearch (Huawei) {@link https://webmaster.petalsearch.com/site/petalbot}
 */
export const OG_DISALLOWED_BOTS = [
    'AhrefsBot',
    'Amazonbot',
    'Amzn-SearchBot',
    'Applebot',
    'GoogleOther',
    'meta-webindexer',
    'PetalBot',
] as const;
