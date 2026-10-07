export type AccountShareData = AccountCardData | ProgramCardData | NotFoundCardData;

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
    /** Whether {@link transactionCount} is an exact figure or a floor ("100+"). */
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

export type ProgramLoader = 'upgradeable' | 'v4' | 'immutable-elf' | 'native' | 'unknown';

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


export type NotFoundReason = 'never-used' | 'has-history' | 'unknown';
export type NotFoundCardData = {
    kind: 'not-found';
    address: string;
    reason: NotFoundReason;
};
