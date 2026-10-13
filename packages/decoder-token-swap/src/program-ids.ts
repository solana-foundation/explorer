import { address } from '@solana/kit';

export const TOKEN_SWAP_PROGRAM_IDS = [
    address('SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8'), // mainnet / testnet / devnet
    address('9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL'), // mainnet - legacy
    address('2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg'), // testnet - legacy
    address('9tdctNJuFsYZ6VrKfKEuwwbPp4SFdFw3jYBZU8QUtzeX'), // testnet - legacy
    address('CrRvVBS4Hmj47TPU3cMukurpmCUYUrdHYxTQBxncBGqw'), // testnet - legacy
    address('BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ'), // devnet - legacy
    address('H1E1G7eD5Rrcy43xvDxXCsjkRggz7MWNMLGJ8YNzJ8PM'), // devnet - legacy
    address('CMoteLxSPVPoc7Drcggf3QPg3ue8WPpxYyZTg77UGqHo'), // devnet - legacy
    address('EEuPz4iZA5reBUeZj6x1VzoiHfYeHMppSCnHZasRFhYo'), // devnet - legacy
    address('5rdpyt5iGfr68qt28hkefcFyF4WtyhTwqKDmHSBG8GZx'), // localnet
] as const;
