declare const connectable: unique symbol;

/**
 * An endpoint a fetch may actually use: the custom-URL consent question is both settled and answered.
 *
 * A plain `string` is not assignable here, so a fetching hook cannot reach for the `url` sitting beside it
 * on the cluster context — that one always resolves, and resolves to the fallback endpoint while consent
 * is still pending. Widening one takes a deliberate call to `toConnectableUrl`, which is grep-able.
 */
export type ConnectableUrl = string & { readonly [connectable]: true };

/** Only for code that has just decided consent is settled, and for tests and stories standing in for it. */
export function toConnectableUrl(url: string): ConnectableUrl {
    return url as ConnectableUrl;
}
