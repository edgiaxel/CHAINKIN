# MVP Acceptance Criteria — Chainkin

A criterion is complete only with implementation evidence and a test or reproducible manual verification.

## A. Setup and quality

- [ ] A fresh checkout can install dependencies using documented commands.
- [ ] Required environment variables are documented in `.env.example`.
- [ ] No secrets, keypairs, seed phrases, or `.env` files are committed.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Program tests pass.

## B. Wallet and network

- [ ] User can connect a supported Solana wallet.
- [ ] App explicitly identifies Solana Devnet.
- [ ] Wrong cluster is detected and explained.
- [ ] No transaction is submitted on Mainnet.
- [ ] User can disconnect safely.

## C. Hatching and identity

- [ ] Connected wallet can derive/check its creature PDA.
- [ ] A wallet without a creature can initialize one.
- [ ] Duplicate initialization is rejected by the program.
- [ ] PDA account stores owner and initial creature state.
- [ ] UI displays fetched, decoded on-chain state.
- [ ] A returning wallet sees its existing creature.

## D. Creature interaction and progression

- [ ] At least one state-changing ritual is implemented end-to-end.
- [ ] Program validates signer/owner and ritual identifier.
- [ ] XP/traits are changed by deterministic program logic.
- [ ] Invalid ritual and progression overflow are rejected.
- [ ] UI updates only after confirmation and account refetch.
- [ ] At least one additional ritual exists if time permits; it is not a blocker if the primary vertical slice is complete.

## E. AI experience

- [ ] AI personality/dialogue endpoint is server-side.
- [ ] API key is never exposed to the browser.
- [ ] Output is schema-validated and length-limited.
- [ ] AI cannot change authoritative progression or sign transactions.
- [ ] Deterministic fallback works when AI is unavailable.
- [ ] Creature remains usable without AI credentials.

## F. Evolution

- [ ] Evolution eligibility is validated by the program.
- [ ] Evolution choices are allowlisted.
- [ ] User explicitly signs the evolution transaction.
- [ ] Confirmed evolution state is fetched from chain and displayed.
- [ ] AI-generated descriptions are narrative only.

## G. Demo readiness

- [ ] A fresh Devnet wallet can complete the demo path.
- [ ] At least one real Devnet transaction is confirmed.
- [ ] Explorer link points to the Devnet transaction.
- [ ] Loading, pending, rejected, failed, and success states are understandable.
- [ ] README includes setup, run, test, and demo instructions.
- [ ] No mocked transaction is presented as a real on-chain action.

## Definition of MVP complete

Minimum submission-ready vertical slice:
1. Connect Devnet wallet.
2. Hatch one creature and create its PDA.
3. Display its on-chain identity/state.
4. Perform one validated ritual and confirm progression on-chain.
5. Show AI personality/dialogue with fallback.
6. Demonstrate evolution eligibility or a completed evolution transaction if feasible.
7. Pass build, typecheck, and relevant tests.

If evolution cannot be completed safely within the available time, document it as a known limitation rather than faking it.
