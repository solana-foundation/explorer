/**
 * Crawlers kept off the OG image routes, as robots.txt user-agent tokens.
 *
 * Docs:
 * Ahrefs {@link https://ahrefs.com/robot#our-bots}
 * Amazon {@link https://developer.amazon.com/amazonbot}
 * Google {@link https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers}
 * Petalsearch (Huawei) {@link https://webmaster.petalsearch.com/site/petalbot}
 */
export const OG_DISALLOWED_BOTS = ['AhrefsBot', 'Amazonbot', 'Amzn-SearchBot', 'GoogleOther', 'PetalBot'] as const;
