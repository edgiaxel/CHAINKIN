# Antigravity Autonomous Build Runbook

## Purpose

Run a bounded autonomous implementation loop for Chainkin while the owner is away. The agent must plan, implement, verify, record progress, and continue through independent tasks.

## Before starting

1. Open the repository root in Antigravity.
2. Confirm the working tree contains the expected files and no unrelated user work will be overwritten.
3. Read `AGENTS.md`.
4. Read `docs/PROJECT_SPEC.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/USER_FLOW.md`, and `docs/ACCEPTANCE_CRITERIA.md`.
5. Confirm the selected Solana cluster is Devnet.
6. Ensure no mainnet keypair or production credentials are available to the agent.
7. Configure required provider credentials manually in the local environment; never put them in prompts or committed files.

## Recommended execution

First use `/plan` to request a concise, dependency-aware implementation plan based on the repository specifications. Review the plan if possible.

Then use `/goal` with the prompt below. Antigravity's exact UI and command behavior may vary by version; if `/goal` is not recognized in the current agent surface, use the same text as the task prompt and run bounded task batches manually.

## Goal prompt

Implement the Chainkin MVP defined in:
- `docs/PROJECT_SPEC.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/USER_FLOW.md`
- `docs/ACCEPTANCE_CRITERIA.md`

Follow `AGENTS.md` without exception.

Execution loop:
1. Read `.agent-work/TASKS.md`, `.agent-work/PROGRESS.md`, `.agent-work/DECISIONS.md`, and `.agent-work/BLOCKERS.md`.
2. Inspect repository state and existing code.
3. Select the highest-priority unfinished, unblocked task.
4. Implement the smallest complete solution.
5. Run relevant formatting, lint, typecheck, tests, and build commands that exist.
6. Diagnose failures; make no more than two focused repair attempts before recording a blocker.
7. Review the diff for scope creep, secrets, generated files, and accidental changes.
8. Commit verified work on the current local branch, unless Git identity/configuration is unavailable or a repository policy forbids it.
9. Update progress and task files with actual evidence.
10. Continue to the next independent task.

Do not stop after a single task. Do not invent additional product scope. Do not deploy or push without explicit approval. Do not use Mainnet. Never access private keys or seed phrases. Never fabricate successful tests or transactions.

If a task requires an API key, faucet, wallet signature, external approval, or other human-only action, document the exact blocker and continue with independent work using a deterministic mock where appropriate. Do not pretend the real integration has been verified.

Stop only when all acceptance criteria are verified or all remaining tasks are blocked by a human action. Produce a concise final report mapping criteria to evidence.

## Unattended run safety

- Keep the machine awake and connected to power/network.
- Use a dedicated feature branch or isolated worktree.
- Do not enable unrestricted filesystem/network access unless necessary and understood.
- Do not expose `.env` or wallet files to the agent.
- Do not allow force-push, branch deletion, mainnet deployment, billing changes, or secret management.
- A long-running goal is not a substitute for monitoring. Inspect commits, test output, and blockers when returning.
