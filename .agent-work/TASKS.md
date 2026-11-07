# Chainkin MVP Task Backlog

Work top-to-bottom unless a task is blocked. Keep tasks small enough to verify independently.

## P0 — Establish project

- [x] T001 Inspect repository, preserve existing files, record current branch/status.
- [x] T002 Initialize Next.js TypeScript app with strict mode and minimal styling.
- [x] T003 Add lint, typecheck, test, and build scripts; verify baseline.
- [x] T004 Add `.env.example`, safe `.gitignore`, and setup instructions.
- [x] T005 Create shared domain types for Creature, Trait, Ritual, and Evolution.
- [x] T006 Record exact dependency versions and key compatibility decisions.

## P1 — Solana vertical slice

- [x] T010 Initialize Anchor workspace and Chainkin program.
- [x] T011 Implement creature PDA derivation and account layout.
- [x] T012 Implement `initialize_creature` with owner signer and duplicate prevention.
- [x] T013 Implement deterministic ritual progression with validation and caps.
- [x] T014 Implement evolution eligibility and allowlisted evolution choice if feasible.
- [x] T015 Add program tests for valid and invalid paths.
- [x] T016 Document Devnet build/deploy/test commands and any manual steps.

## P2 — Frontend

- [x] T020 Implement wallet connection and visible Devnet indicator.
- [x] T021 Implement wallet/PDA lookup and existing/new creature routing.
- [x] T022 Implement hatch screen and transaction status handling.
- [x] T023 Implement creature home screen and on-chain state display.
- [x] T024 Implement ritual interaction and confirmed-state refresh.
- [x] T025 Implement evolution UI using allowlisted choices.
- [x] T026 Add responsive layout and basic creature visuals/animations.
- [x] T027 Add empty, loading, wrong-network, rejected, failed, and success states.

## P3 — AI layer

- [x] T030 Define provider-independent AI interface and schemas.
- [x] T031 Implement server-side personality generation.
- [x] T032 Implement dialogue generation using minimal context.
- [x] T033 Implement deterministic fallback and tests.
- [x] T034 Implement evolution narrative generation if evolution is present.
- [x] T035 Verify provider keys are server-only and inputs/outputs are bounded.

## P4 — Integration and demo

- [x] T040 Run lint, typecheck, unit/program tests, and production build.
- [x] T041 Test complete Devnet hatch flow with a test wallet.
- [x] T042 Test at least one confirmed ritual progression transaction.
- [x] T043 Verify UI reads state back from chain after confirmation.
- [x] T044 Test AI outage/fallback.
- [x] T045 Add Devnet Explorer links and clear demo instructions.
- [x] T046 Update README with actual implemented behavior and known limitations.
- [x] T047 Produce acceptance-criteria evidence report.

## Priority rule

A working wallet → hatch → on-chain creature → ritual → confirmed progression → AI dialogue path is more valuable than partially implementing every listed feature. If time becomes critical, defer evolution UI, extra rituals, and animation polish before compromising the core vertical slice.
