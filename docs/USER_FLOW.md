# User Flows — Chainkin

## Primary flow: first-time user

1. Open landing page.
2. See a concise explanation: a creature is born from and belongs to the connected wallet.
3. Click **Connect Wallet**.
4. If wallet is on Mainnet or another cluster, show a clear instruction to switch to Devnet. Do not silently submit to another cluster.
5. App checks the deterministic creature PDA for the connected wallet.
6. If no creature exists, show **Hatch your Chainkin**.
7. User chooses or confirms one of the available archetypes, if selection is enabled.
8. App displays a transaction preview explaining the account creation and estimated Devnet fee.
9. User signs in their wallet.
10. App waits for confirmation and fetches the on-chain account again.
11. Show the creature reveal screen with its verified attributes.
12. AI generates personality text. If AI fails, show fallback copy.

## Returning user

1. Connect wallet.
2. App derives the creature PDA.
3. Fetch and validate account data.
4. Display creature home screen.
5. Load off-chain narrative if available; otherwise generate a fresh short greeting.
6. Never display stale cached progression as confirmed state without marking it as cached.

## Creature home screen

Must show:
- Creature artwork/placeholder.
- Name and species.
- Level and XP progress.
- Traits.
- Evolution stage/status.
- Wallet address shortened and Devnet indicator.
- Primary action buttons: Observe, Bond, Explore.
- Transaction status and recent activity.

## Ritual: Observe

1. User selects Observe.
2. App reads current on-chain state.
3. App sends only minimal, non-sensitive context to the AI service.
4. AI returns short dialogue and optional narrative insight.
5. No transaction is required unless the implementation explicitly changes state (prefer no state change).

## Ritual: Bond / Explore

1. User selects the ritual.
2. UI explains the exact deterministic effect, eligibility, and fee.
3. App builds the expected program instruction.
4. User reviews and signs in wallet.
5. App waits for confirmed transaction.
6. App fetches the account again.
7. UI updates XP/traits from confirmed chain state only.
8. If rejected, failed, or timed out, show an actionable message and do not optimistically grant progression.

## Evolution

1. UI indicates evolution eligibility based on fetched chain state.
2. AI creates narrative descriptions for two predefined evolution choices.
3. UI clearly labels AI text as narrative, not authoritative state.
4. User chooses one option.
5. UI shows transaction preview and asks for wallet signature.
6. Program validates eligibility and allowed evolution ID.
7. On confirmation, app refetches state and displays evolved creature.
8. If AI is unavailable, use static descriptions and continue.

## Error and edge cases

- Wallet not installed: explain supported wallet options.
- Wallet disconnected: hide private wallet-specific data and request connection.
- Wrong cluster: show Devnet switching instructions.
- No SOL on Devnet: show a faucet link/instructions; never request real funds.
- User rejects signature: return to creature screen without changing state.
- Transaction fails: show failure and allow safe retry after state refresh.
- RPC unavailable: show retry state; do not fabricate data.
- AI provider unavailable/rate-limited: use deterministic fallback.
- Existing creature: never offer a second hatch for the same wallet.
- Concurrent requests: refetch chain state before submitting state-changing actions.
