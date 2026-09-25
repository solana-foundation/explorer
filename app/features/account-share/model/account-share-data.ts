/**
 * The data behind an account OG image, already formatted for the card.
 *
 * A discriminated union: the route classifies the address once and hands the card exactly the shape it
 * draws, so `BaseAccountImage` never re-derives anything. The first release renders three kinds - a
 * universal `account`, a richer `program`, and a `not-found` fallback - matching the "First release" cards
 * in the share-image design gallery.
 */
export type AccountShareData = AccountCardData | ProgramCardData | NotFoundCardData;

/**
 * A three-state signal for a provenance marker: `yes` and `no` are established facts, `unknown` is used
 * when the lookup itself failed or the check isn't supported for this program, so the card never claims a
 * negative it could not actually verify.
 */
export type MarkerState = 'yes' | 'no' | 'unknown';

/** The universal account card: every non-program account that exists. */
export type AccountCardData = {
    kind: 'account';
    address: string;
    /**
     * Whether some signal on this card could not be resolved (e.g. the activity lookup failed). Incomplete
     * cards are cached briefly rather than for the full resolved lifetime, so a transient blip is not pinned.
     */
    incomplete: boolean;
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

/**
 * The three build-provenance markers on a program card, each drawn as an icon + label. Every marker is a
 * {@link MarkerState}: an `unknown` marker renders neutrally instead of asserting "Not verified" / "No IDL"
 * when the underlying lookup failed or the check does not apply to the program's loader.
 */
export type ProgramMarkers = {
    verifiedBuild: MarkerState;
    idlUploaded: MarkerState;
    securityTxt: MarkerState;
};

/** The program's upgrade authority, or its absence. */
export type UpgradeAuthority = {
    /** The authority key, drawn in green mono. Absent for an immutable program. */
    address?: string;
    /**
     * The authority's structure, shown after the address as "· <note>" - e.g. "Immutable" when there is
     * no address. Absent when undetermined, in which case only the address prints.
     */
    note?: string;
};

/** The loader that owns an executable account, deciding where its bytes live and whether it can be upgraded. */
export type ProgramLoader = 'upgradeable' | 'v4' | 'immutable-elf' | 'native' | 'unknown';

/** The program card: any executable account (upgradeable, v4, legacy, or native loader). */
export type ProgramCardData = {
    kind: 'program';
    address: string;
    /**
     * Whether some signal on this card could not be resolved - any `unknown` marker, or a program-data
     * lookup that failed. Incomplete cards are cached briefly so a transient failure is not pinned.
     */
    incomplete: boolean;
    /** "Jupiter Aggregator v6", or the truncated address when nothing named it. */
    name: string;
    markers: ProgramMarkers;
    upgradeAuthority?: UpgradeAuthority;
    /** The slot the program data was last written in. */
    lastDeployedSlot?: number;
    /** "1.24 MB". */
    programSize?: string;
};

/**
 * Why no account renders: `has-history` when the address has on-chain signatures (which does *not* prove the
 * account ever existed - a failed creation transaction leaves history too - so the copy stops short of
 * claiming "closed"), `never-used` when it has none, and `unknown` when the history lookup itself failed.
 */
export type NotFoundReason = 'never-used' | 'has-history' | 'unknown';

/** The fallback card: a valid address the cluster holds no account for. */
export type NotFoundCardData = {
    kind: 'not-found';
    address: string;
    reason: NotFoundReason;
};
