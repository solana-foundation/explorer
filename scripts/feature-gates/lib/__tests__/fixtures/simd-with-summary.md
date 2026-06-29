---
simd: '0148'
title: Feature gate stake move helpers
authors:
  - alice
status: Accepted
type: Core
---

## Summary

Introduce two new stake program instructions, `MoveStake` and
`MoveLamports`, that let stake managers shuffle balance between
stake accounts without holding the Withdrawer authority.

## Motivation

This is more detail that should NOT appear in the summary blurb.
