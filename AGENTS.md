# Agent Instructions — Chainkin

## Mission

Implement the MVP in `docs/PROJECT_SPEC.md`, following `docs/TECHNICAL_ARCHITECTURE.md` and proving completion against `docs/ACCEPTANCE_CRITERIA.md`.

## Mandatory first actions

1. Read this file and all files under `docs/` relevant to the task.
2. Read `.agent-work/TASKS.md`, `PROGRESS.md`, `DECISIONS.md`, and `BLOCKERS.md`.
3. Inspect the actual repository before changing anything. Preserve existing user work.
4. Identify the highest-priority unblocked task. Do not assume a blank repository.

## Engineering rules

- Prefer the smallest working implementation that satisfies an acceptance criterion.
- TypeScript strict mode; validate external data at runtime (Zod or equivalent).
- Keep AI provider integration behind a small provider-independent interface.
- Keep blockchain state authoritative on-chain; never trust frontend state for ownership or progression.
- Use Solana Devnet only. Do not use mainnet endpoints, mainnet program IDs, or real funds.
- Use wallet-adapter signing flow; the application must never handle private keys or seed phrases.
- Do not store AI dialogue or large metadata on-chain.
- Keep secrets server-side. Never expose API keys in `NEXT_PUBLIC_*` variables.
- Do not add tokenomics, paid mechanics, staking, trading, marketplace, breeding, multiplayer, or unrelated features.
- Avoid unnecessary dependencies and infrastructure.
- Do not invent SDK APIs. Check installed package versions and official local typings/docs before implementing.
- If the selected Anchor TypeScript client requires `@solana/web3.js` v1, keep that dependency isolated and compatible. Do not mix incompatible Solana SDK generations casually.
- Prefer deterministic tests for program logic and mock AI responses in automated tests.
- Never claim a test, build, deployment, or transaction succeeded unless it was actually run and verified.

## Task protocol

For each task:

1. Read its scope, dependencies, and acceptance criteria.
2. Inspect nearby code and current branch status.
3. Implement only the task's scope.
4. Run relevant formatting, lint, typecheck, unit/program tests, and build commands that exist in the repo.
5. Diagnose failures. Make at most two focused repair attempts before recording a blocker and moving to an independent task.
6. Review `git diff` for accidental changes, secrets, generated files, and scope creep.
7. Commit only if the task is verified and the current branch is intended for that commit.
8. Update `.agent-work/PROGRESS.md` and `.agent-work/TASKS.md` with evidence, commit hash, and remaining work.

## Autonomy and stop conditions

- Continue through independent, unblocked MVP tasks without asking for routine approval.
- Do not stop after one task merely to report progress.
- Stop when all MVP acceptance criteria are verified, or when a human decision/credential/approval is genuinely required.
- Do not spin indefinitely. Follow task-level retry limits and record blockers.
- Do not make destructive Git changes, force-push, rewrite shared history, merge branches, or deploy externally without explicit approval.
- Do not change repository settings, billing, account permissions, or secrets.
- If a requirement is ambiguous, choose the safest minimal interpretation and record the decision. Ask only if the ambiguity blocks a core requirement.

## Reporting

After each task, record:
- Task ID and status.
- Files changed.
- Commands/tests actually executed and results.
- Commit hash, if committed.
- Blockers and next task.
