## ADDED Requirements

### Requirement: A dependency version SHALL age before it can be installed or proposed

A published version SHALL NOT enter the tree until it has been publicly available for a fixed minimum period, currently 14 days. The window is a supply-chain control: it buys time for a compromised release to be noticed and yanked. It says nothing about whether the version works, and MUST NOT be treated as a compatibility check.

#### Scenario: A version is published inside the window

- **WHEN** a release is younger than the window
- **THEN** the resolver SHALL refuse to install it
- **AND** the update bot SHALL NOT propose it

#### Scenario: The window is changed

- **WHEN** the window is changed for one tool that selects versions
- **THEN** it SHALL be changed for every other such tool
- **AND** a disagreement SHALL be treated as a defect, because it either proposes versions the resolver refuses or withholds versions the resolver would accept

### Requirement: Breaking updates SHALL be proposed one at a time

An update group SHALL cover only non-breaking updates, so a major version bump arrives on its own rather than bundled with unrelated bumps. Age is not evidence of compatibility — a breaking release is as breaking after a month as on the day it shipped — so the age window neither holds a major back nor stands in for looking at one.

#### Scenario: Several breaking updates become available at once

- **WHEN** more than one grouped dependency has a major update available
- **THEN** each SHALL be proposed separately
- **AND** the grouped proposal SHALL carry only the non-breaking updates
