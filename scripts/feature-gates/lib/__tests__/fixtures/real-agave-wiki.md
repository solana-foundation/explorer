## Version Floor
The version floor is the current minimum supported software version for a cluster. As new feature gates are activated, the version floor is raised to match the software release that the feature gate shipped in. For minor version updates on mainnet-beta the version floor will be raised (and activations will begin) two full epochs after 95% of stake adopts the new minor version.

|| Testnet  | Devnet   | Mainnet Beta |
| :-----: | :------: | :------: | :----------: |
| Current floor | Agave: v4.0.0-beta.7 <br> Frankendancer: v0.905.40007 | Agave: v4.0.0-beta.6 <br> Frankendancer: v0.904.40006 | Agave: v3.1.7 <br> Frankendancer: v0.812.30108 |
| Next expected floor * |  -- | -- | -- |

\* These dates are tentative. Please keep an eye out for comms as the dates near


## Current Schedule
### Pending Mainnet Beta Activation
| Key | SIMD | Agave Version | FD Version | Jito Version | Testnet | Devnet | Description | Owner |
|-----|------|---------------|------------|--------------|---------|--------|-------------|-------|
| 6sPDzwyARRExKH52LECxcGoqziH8G7SZofwuxi8Ja331 | 0312  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 935 | 1052 | SIMD-0312: CreateAccountAllowPrefund | joncinque |
| 2GCrNXbzmt4xrwdcKS2RdsLzsgu4V5zHAemW57pcHT6a | 0458  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 936 | 1054 | SIMD-0458: Stop use static SimpleVote transaction cost | tao-stones |
| zkexuyPRdyTVbZqEAREueqL2xvvoBhRgth9xGSc1tMN |   | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 937 | 1055 | Re-enables zk-elgamal-proof program | samkim-crypto |
| bn2oPgpkzQPT3tohMaAsMVGjhDmmDa4jCaVPqCFmtxM | 0284  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 938 | 1056 | SIMD-0284: Add little-endian compatibility for alt_bn128 | samkim-crypto |
| bn1hKNURMGQaQoEVxahcEAcqiX3NwRs6hgKKNSLeKxH | 0302  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 939 | 1058 | SIMD-0302: Add alt_bn128 G2 syscalls | samkim-crypto |
| b1sgUiJ3qu7hYm3tNDyyqZNQd6gLGJmJppnLNa93PCQ | 0388  | v4.0.0-beta.2 | v1.0 | v4.0.0-beta.2 | 941 | 1059 | SIMD-0388: BLS12-381 syscalls | samkim-crypto |
| STk5Xj8hdAx3sTzmtJ3QysKkq6X2A3yj73JtxttiRyk | 490  | v4.0.0-beta.3 | v1.0 | v4.0.0-beta.3 | 942 | 1065 | SIMD-0490: Upgrade BPF Stake Program to v5.0.0 | 2501babe |
| 76dHtohc2s5dR3ahJyBxs7eJJVipFkaPdih9CLgTTb4B | 0249  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 943 | 1066 | SIMD-0249: Delay Commission Updates | joncinque |
| vcmrbYbiMVKaq1snKP6eCacNDcr6qZvpCNUjmk6gxvZ | 0340  | v4.0.0-beta.6 | v1.0 | v4.0.0-beta.6 | 945 | 1067 | SIMD-0340 validate chained block id | AshwinSekar |
| 5cC3foj77CWun58pC51ebHFUWavHWKarWyR5UUik7dnC | 0178, 0189, 0377  | v4.0.0 | v1.0 | v4.0.0 | 947 | 1069 | SIMD-0178/0189/0377: Enables deployment and execution of SBPFv3 programs | Lichtso |
| EDGMC5kxFxGk4ixsNkGt8bW7QL5hDMXnbwaZvYMwNfzF | 0459  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 956 | 1070 | SIMD-0459: Syscall Parameter Address Restrictions | Lichtso |
| 7VgiehxNxu53KdxgLspGQY8myE6f7UokaWa4jsGcaSz | 0460  | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 957 | 1073 | SIMD-0460: Virtual Address Space Adjustments | Lichtso |
| CR3dVN2Yoo95Y96kLSTaziWDAQT2MNEpiWh5cqVq2pNE |   | v4.0.0-beta.0 | v1.0 | v4.0.0-beta.0 | 958 | 1074 | Account Data Direct Mapping | Lichtso |

### Pending Devnet Activation
| Key | SIMD | Agave Version | FD Version | Jito Version | Testnet | Devnet | Description | Owner |
|-----|------|---------------|------------|--------------|---------|--------|-------------|-------|


### Pending Testnet Activation
| Key | SIMD | Agave Version | FD Version | Jito Version | Testnet | Devnet | Description | Owner |
|-----|------|---------------|------------|--------------|---------|--------|-------------|-------|
| AnAP9zPV4KL7czAPQbFhpDKV2tx7g4UGNbK9wvXwjaRo | 0387  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0387: BLS Pubkey Management in Vote Account | buffalojoec |
| 6aHuNsUmwSzCEMjrBzBCYaxHAyAcQBjVES92JigHBDuC | 0406  | v4.0.0-beta.7 | v1.0 |  |  |  | SIMD-0406: Maximum instruction accounts | LucasSte |
| B8JJXCy5amZyWG9r7EnUYLwzXSXTxG7GZ1qZ1qggo83g | 0500  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0500: Disable deployment of SBPF v0, v1 and v2 programs | Lichtso |
| YbbRLkvenrocjGPGyoQE4wjnvYzTgfsk38NFmcYK7a5 | 0431  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0431: Loader V3 minimum extend program size | buffalojoec |
| s512oDwgx8hjMnaQjXfqqrZroVj4HvC6TkN3iSSWXCh | 0512  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0512: SHA512 Syscall | samkim-crypto |
| Eg7tXEwMZzS98xaZ1YHUbdRHsaYZiCsSaR6sKgxreoaj | 0291  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0291: Commission rate in basis points | buffalojoec |
| disCA4efguFL6Wqa4pGdG7jpjC7C5uiKzKnhEBqchBe | 0337  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0337: Markers for Alpenglow Fast Leader Handover, DATA_COMPLETE_SHRED placement rules | AshwinSekar |
| VAT9huvhPjRN9cyrPytq9rwvEJ3J4ADtjdncgZRyANJ | 0357  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0357: Alpenglow VAT implementation | AshwinSekar |
| ptr9umikaeAS7ZBBp2fsfRhie16F1V2jCKA2y6gXNAK | 0449  | v4.1.0-beta.0 | v1.0 |  |  |  | SIMD-0449: Direct Account Pointers in Program Input | febo |
