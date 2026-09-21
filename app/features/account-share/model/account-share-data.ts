/**
 * The data behind an account OG image, already formatted for the card.
 *
 * A discriminated union: the route classifies the address once and hands the card exactly the shape it
 * draws, so `BaseAccountImage` never re-derives anything. The first release renders three kinds - a
 * universal `account`, a richer `program`, and a `not-found` fallback - matching the "First release" cards
 * in the share-image design gallery.
 */
export type AccountShareData = AccountCardData | ProgramCardData | NotFoundCardData;

/** The universal account card: every non-program account that exists. */
export type AccountCardData = {
    kind: 'account';
    address: string;
    /** The owner program, printed as "Owned by <owner>". Absent for a system-owned wallet. */
    owner?: string;
    /** "2.03928144 SOL". */
    balance: string;
    /** "1,204". Absent when the signature lookup returned nothing or was skipped. */
    transactionCount?: string;
    /** Whether {@link transactionCount} is an exact figure or a floor ("1,000+"). */
    transactionCountIsCapped?: boolean;
    /** "Aug 26, 2026". Absent when no signature carried a block time. */
    lastActivity?: string;
    /** "165 B". */
    dataSize: string;
    executable: boolean;
};

/** The three build-provenance markers on a program card, each drawn as an icon + label. */
export type ProgramMarkers = {
    verifiedBuild: boolean;
    idlUploaded: boolean;
    securityTxt: boolean;
};

/** The program's upgrade authority, or its absence. */
export type UpgradeAuthority = {
    /** The authority key, drawn in green mono. Absent for an immutable program. */
    address?: string;
    /**
     * The authority's structure, shown after the address as "· <note>" - e.g. "Single key" or
     * "Squads multisig 3 of 5", or "Immutable" when there is no address. Absent when undetermined, in
     * which case only the address prints.
     */
    note?: string;
    /** A single upgrade key is the weakest posture, so its note is drawn in the amber alert colour. */
    alert?: boolean;
};

/** The program card: an executable account behind the upgradeable BPF loader. */
export type ProgramCardData = {
    kind: 'program';
    address: string;
    /** "Jupiter Aggregator v6", or the truncated address when nothing named it. */
    name: string;
    markers: ProgramMarkers;
    upgradeAuthority?: UpgradeAuthority;
    /** The slot the program data was last written in. */
    lastDeployedSlot?: number;
    /** "1.24 MB". */
    programSize?: string;
};

/** Why no account renders: distinguishes an address that never existed from one that was closed. */
export type NotFoundReason = 'never-used' | 'closed' | 'other-cluster';

/** The fallback card: a valid address the cluster holds no account for. */
export type NotFoundCardData = {
    kind: 'not-found';
    address: string;
    reason: NotFoundReason;
};
