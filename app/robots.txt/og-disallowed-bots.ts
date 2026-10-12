/**
 * Crawlers kept off the OG image routes, as robots.txt user-agent tokens.
 *
 * Docs:
 * AhrefsBot {@link https://ahrefs.com/robot#our-bots}
 * Amazonbot {@link https://developer.amazon.com/amazonbot}
 * Google crawlers {@link https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers}
 */
export const OG_DISALLOWED_BOTS = ['AhrefsBot', 'Amazonbot', 'GoogleOther'] as const;
