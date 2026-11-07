# Chainkin MVP Task Backlog

Work top-to-bottom unless a task is blocked. Keep tasks small enough to verify independently.

## P0 — Establish project

- [x] T001 Inspect repository, preserve existing files, record current branch/status.
- [ ] T002 Initialize Next.js TypeScript app with strict mode and minimal styling.
- [ ] T003 Add lint, typecheck, test, and build scripts; verify baseline.
- [ ] T004 Add `.env.example`, safe `.gitignore`, and setup instructions.
- [ ] T005 Create shared domain types for Creature, Trait, Ritual, and Evolution.
- [ ] T006 Record exact dependency versions and key compatibility decisions.

## P1 — Solana vertical slice

- [ ] T010 Initialize Anchor workspace and Chainkin program.
- [ ] T011 Implement creature PDA derivation and account layout.
- [ ] T012 Implement `initialize_creature` with owner signer and duplicate prevention.
- [ ] T013 Implement deterministic ritual progression with validation and caps.
- [ ] T014 Implement evolution eligibility and allowlisted evolution choice if feasible.
- [ ] T015 Add program tests for valid and invalid paths.
- [ ] T016 Document Devnet build/deploy/test commands and any manual steps.

## P2 — Frontend

- [ ] T020 Implement wallet connection and visible Devnet indicator.
- [ ] T021 Implement wallet/PDA lookup and existing/new creature routing.
- [ ] T022 Implement hatch screen and transaction status handling.
- [ ] T023 Implement creature home screen and on-chain state display.
- [ ] T024 Implement ritual interaction and confirmed-state refresh.
- [ ] T025 Implement evolution UI using allowlisted choices.
- [ ] T026 Add responsive layout and basic creature visuals/animations.
- [ ] T027 Add empty, loading, wrong-network, rejected, failed, and success states.

## P3 — AI layer

- [ ] T030 Define provider-independent AI interface and schemas.
- [ ] T031 Implement server-side personality generation.
- [ ] T032 Implement dialogue generation using minimal context.
- [ ] T033 Implement deterministic fallback and tests.
- [ ] T034 Implement evolution narrative generation if evolution is present.
- [ ] T035 Verify provider keys are server-only and inputs/outputs are bounded.

## P4 — Integration and demo

- [ ] T040 Run lint, typecheck, unit/program tests, and production build.
- [ ] T041 Test complete Devnet hatch flow with a test wallet.
- [ ] T042 Test at least one confirmed ritual progression transaction.
- [ ] T043 Verify UI reads state back from chain after confirmation.
- [ ] T044 Test AI outage/fallback.
- [ ] T045 Add Devnet Explorer links and clear demo instructions.
- [ ] T046 Update README with actual implemented behavior and known limitations.
- [ ] T047 Produce acceptance-criteria evidence report.

## Priority rule

A working wallet → hatch → on-chain creature → ritual → confirmed progression → AI dialogue path is more valuable than partially implementing every listed feature. If time becomes critical, defer evolution UI, extra rituals, and animation polish before compromising the core vertical slice.
