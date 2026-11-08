# Chainkin --- Final Product Revision & Hackathon Demo Brief

**Repository:** https://github.com/edgiaxel/CHAINKIN\
**Purpose:** Final revision specification for the existing Chainkin
hackathon project, followed by browser QA and a YouTube-ready product
demo video.\
**Execution mode:** One primary coding agent. Do not use Teamwork or
spawn a swarm of subagents.\
**Network:** Solana Devnet only.

## 1. Mission

Turn Chainkin from a working creature-management prototype into a
coherent, game-like, wallet-linked AI companion application.

The existing Solana implementation is the foundation and must be
preserved. The current creature page is the starting point for the
companion experience, not something to discard.

The final product should let a user: 1. Open a welcoming home screen. 2.
Connect and switch between Solana wallets. 3. See creatures associated
with each wallet. 4. Hatch and manage more than one creature where the
on-chain architecture safely supports it. 5. Open an individual
creature's companion page. 6. Talk to the creature and receive
meaningful, personality-aware responses. 7. Perform rituals and see real
progression reflected in the application. 8. Unlock distinct evolution
stages at levels 3, 7, and 15. 9. View, print, and share a creature stat
card. 10. Return to the home screen and manage their collection.

The application should feel like a small creature-raising game, not a
generic admin dashboard.

**Product principle:** Solana is the source of truth for ownership and
progression. AI provides narrative, dialogue, and contextual reactions.
AI must never fabricate or directly authorize on-chain state changes.

## 2. Execution rules and resource limits

-   Use one primary agent. Do not use Teamwork or spawn additional
    agents unless the user explicitly approves.
-   Inspect the current repository, branch, working tree, documentation,
    and actual running application first.
-   Preserve existing working features and the current visual identity
    where effective.
-   Verify progress claims against actual code and behavior.
-   Make a short implementation plan, then execute. Do not stop after
    planning.
-   Work in small, verifiable phases. Run checks after each major phase.
-   Avoid large rewrites, unnecessary dependencies, and speculative
    infrastructure.
-   Devnet only. Never deploy to mainnet.
-   Never request, read, log, or expose wallet seed phrases or private
    keys.
-   Never commit `.env.local`, API keys, secrets, or private user data.
-   Never fabricate successful transactions, AI responses, screenshots,
    test results, or demo footage.
-   Keep a concise changelog of significant decisions and deferred
    requirements.

Before editing: - Inspect `git status`, current branch, and recent
commits. - Preserve uncommitted user work. - Create a feature branch or
checkpoint only after confirming the working tree state. - Do not
overwrite the user's working branch or push changes without the user's
normal approval/workflow.

## 3. Critical architecture decisions

### 3.1 Multiple wallets

Support multiple wallet identities with a clear distinction:

-   **Active wallet:** currently connected through the Solana wallet
    adapter and able to sign transactions.
-   **Saved/watch-only wallet:** public address stored for viewing, if
    supported.
-   **Wallet switching:** selecting a wallet changes which creatures and
    data are displayed.

Do not imply the application can sign for multiple wallets
simultaneously. Each wallet must be actively connected and approve its
own transactions through its wallet provider.

Never store private keys or seed phrases. Store only public addresses
and non-sensitive preferences. Make the active wallet obvious.

### 3.2 Multiple creatures per wallet --- critical Solana compatibility check

The previous Anchor program used a creature PDA derived from the owner
wallet, reportedly similar to:

`[b"creature", owner_pubkey]`

That design permits only one creature PDA per wallet. A frontend-only
change cannot safely create multiple on-chain creatures under the same
PDA scheme.

Inspect: - Current Anchor account seeds and constraints. - Deployed
Devnet program ID and upgrade authority. - Existing account layout and
initialization logic. - How the frontend discovers a wallet's
creatures. - Whether existing creature accounts remain readable after an
upgrade.

If feasible without risking the working demo, design a unique creature
identifier per owner, for example:

`[b"creature", owner_pubkey, creature_id]`

Implement a safe discovery mechanism, such as a wallet-owned
profile/registry PDA containing creature identifiers, or another
architecture justified by the existing code.

Requirements: - Existing single-creature accounts must not silently
become inaccessible. - Do not assume arbitrary PDAs can be enumerated
without an index/discovery strategy. - Avoid an unbounded registry
without a size strategy. - Add owner-isolation and duplicate-ID tests. -
Verify upgrade authority; do not assume it exists. - Do not deploy a
breaking program change until migration and rollback implications are
understood.

**Fallback:** If the on-chain migration is too risky for the deadline,
preserve the working single-creature-per-wallet flow and implement
multi-wallet collection management first. Report
multi-creature-per-wallet as deferred rather than faking it. Do not
create off-chain-only creatures and present them as on-chain assets.

### 3.3 State boundaries

**Authoritative on-chain state:** owner, creature identity/species,
XP/level where represented, traits/stats actually updated by program
instructions, evolution stage/path if implemented, confirmed transaction
references.

**Off-chain application state:** dialogue, conversation context,
temporary mood/narrative state, UI preferences, saved public wallet
addresses, local interaction history.

Label off-chain narrative state honestly. Never imply generated mood or
dialogue is an on-chain transaction.

## 4. Application information architecture

Use a **floating, centered top navigation bar**. It must not be attached
to the viewport's top edge and must not become a generic left sidebar.

Suggested navigation: - **Home** --- collection overview and active
wallet. - **Collection** --- creatures grouped by wallet. - **Profile /
Settings** --- wallet preferences and application settings.

Selecting a creature opens its dedicated companion page. Retain and
improve the existing creature experience.

### 4.1 Home screen

For disconnected users: - Explain Chainkin concisely. - Show the primary
Connect Wallet action. - Explain wallet-linked creatures and Solana
Devnet. - Do not show fake statistics or fabricated creatures.

For connected users: - Show the active wallet in shortened form. - Show
network status (Devnet). - Show the actual number of discovered
creatures. - Show creature cards with artwork, name, species, level,
evolution stage, and personality descriptor. - Provide Select / Open
Creature. - Provide wallet switching. - Show an Awaken Creature empty
state when appropriate.

If saved wallets are supported, group creatures by wallet and
distinguish active from watch-only wallets.

### 4.2 Collection page

-   List discovered creatures for selected/saved wallets.
-   Selecting a creature opens its companion page.
-   Show species, level, evolution stage, and key stats.
-   Handle loading, empty, and account-fetch failure states.
-   Never display placeholders as real on-chain creatures.

If multi-creature support is not safely implemented on-chain, represent
the current capability accurately.

### 4.3 Creature companion page

Retain and improve the existing page. Keep the creature visually
prominent.

Include: - Artwork and current form. - Name and species. - Level and XP
progress. - Evolution stage and next requirement. - Personality and
traits. - Mood, clearly identified as off-chain if applicable. -
Dialogue/interaction area. - Ritual actions. - Evolution actions when
eligible. - Back-to-collection/home navigation.

Every action must work or be clearly marked unavailable.

### 4.4 Profile and settings

Keep this lightweight: - Saved public wallet addresses, if
implemented. - Active wallet and network information. - AI provider
status without exposing secrets. - Optional reduced-motion setting. -
Sound setting only if sound is implemented. - Clear local interaction
history action, if local history exists. - About/version/Devnet notice.

Do not add account/password authentication unless required by the
existing architecture.

## 5. AI companion --- highest functional priority

The recurring defect is that Observe, Talk, and other interaction
controls do not reliably update visible dialogue. Requests appear to
consume provider usage without producing meaningful responses.

Fix the complete request-to-render pipeline, not just the prompt.

### 5.1 Trace the complete pipeline

Verify: 1. User clicks an interaction. 2. Frontend sends the correct
request. 3. Request contains the selected creature's current context. 4.
Server constructs the system/context prompt. 5. Provider request reaches
the configured model. 6. Response is parsed and validated. 7. Server
returns a predictable schema. 8. Frontend updates the correct creature's
dialogue and state. 9. Errors and timeouts are visible and recoverable.

Investigate incorrect routes/payloads, stale React state, discarded
responses, stuck loading states, duplicate requests, parsing errors,
JSON-mode incompatibility, short timeouts, swallowed errors, and
fallback mode being misrepresented as live AI.

### 5.2 Daily request budget

Provider allowance: **50 requests/day**. Preserve a safety margin.

Implement: - Default application cap of **35 provider requests/day**,
leaving at least 15 requests in reserve. - Configurable server-side
cap. - Per-wallet limits in addition to the global cap. - No model calls
on page load, refresh, wallet connection, or every render. - Calls only
for explicit interactions or deliberate post-transaction reactions. -
Disable/debounce repeated clicks while a request is in progress. - Cache
identical requests where appropriate. - No unbounded retries or repeated
calls for malformed output. - One well-designed call per interaction
where possible. - Clear limit message and deterministic fallback when
capped.

Do not rely on in-memory rate limiting in a multi-instance serverless
deployment. Use storage compatible with the existing project; if durable
shared storage is unavailable, document the limitation and implement the
safest practical demo protection.

### 5.3 System/context prompt

Build context from the selected creature's actual current data: - Name
and species. - Species-specific behavior rules. - Personality profile. -
Actual traits and stats. - Current mood, if available. - Level and XP. -
Evolution stage/path. - Recent ritual or interaction. - Recent
conversation context, if available. - Current user action. - Relevant
confirmed state changes.

Never send fabricated traits or progression.

### 5.4 Distinct personalities

Use existing species (Wisp, Bytebeast, Mossling) unless repository code
establishes a different authoritative list.

For each species define: - Voice and sentence style. - Typical emotional
expression. - Curiosity, confidence, empathy, and playfulness
tendencies. - Reactions to praise, neglect, exploration, bonding, and
evolution. - Things it should avoid saying. - How its behavior changes
as it evolves.

Traits must influence generated text observably. Species must not sound
interchangeable. Avoid random purple prose or pseudo-scientific filler.

### 5.5 Interaction contracts

  -----------------------------------------------------------------------
  Action                              Expected output
  ----------------------------------- -----------------------------------
  Talk                                Responds to the user's message and
                                      current creature context.

  Ponder                              Produces a short internal thought
                                      reflecting personality and
                                      situation.

  Comfort                             Responds empathetically according
                                      to species/personality.

  Observe                             Comments on current condition,
                                      traits, mood, environment, or
                                      recent history.

  Bond ritual                         Reacts to the successful ritual and
                                      actual resulting state.

  Explore ritual                      Reacts to exploration and actual
                                      resulting state.

  Evolution                           Recognizes its new form without
                                      inventing stats.
  -----------------------------------------------------------------------

For transaction-backed actions: 1. Submit transaction. 2. Wait for
actual confirmation. 3. Fetch updated on-chain state. 4. Generate one
contextual reaction using refreshed state. 5. Update visible dialogue.

If the transaction fails or is rejected, do not generate a success
reaction.

Off-chain interactions may update dialogue, but must not pretend XP or
on-chain traits changed.

### 5.6 Structured response and fallback

Define and validate a stable schema, using only fields the UI needs, for
example: - `dialogue` - `mood` (allowed enum) - `expression` (supported
animation key) - `shortStatus` - `memoryNote` (optional)

Validate server-side. Normalize/reject invalid values. Never accept
arbitrary HTML or executable content from model output.

Use deterministic fallback behavior when the provider is unavailable.
Clearly distinguish fallback mode from live AI mode.

### 5.7 Model diagnosis

Current test model: Liquid LFM3 1.7B through OpenRouter.

Do not assume the model is the only problem. Verify provider
reachability, response-format support, timeout, parsing, prompt
adherence, and frontend rendering.

The user authorizes model experimentation within the 50/day allowance,
but the application must retain the 35-request default safety budget.
Use a small number of deliberate tests rather than uncontrolled
experiments.

## 6. Progression and evolution

Add milestones: - **Level 3 --- Evolution Stage I** - **Level 7 ---
Evolution Stage II** - **Level 15 --- Evolution Stage III**

Inspect current XP/level calculations first. Do not create conflicting
progression semantics.

Create data-driven evolution definitions for every species: - Base
form. - Stage I at level 3. - Stage II at level 7. - Stage III at level
15. - Distinct visual identity per stage. - Stage-specific stat
modifiers where supported. - Stage-specific personality/dialogue
changes. - Clear evolution path description.

Evolution choices must matter. Where appropriate, branch selection may
depend on player choice and/or actual trait values. Prefer a small
number of meaningful paths over many shallow branches.

Inspect available artwork. Reuse valid assets. Explicitly report missing
evolution artwork. Do not silently reuse unrelated species art. Keep
artwork mapping data-driven.

Separate base species stats, current on-chain stats, evolution
modifiers, and derived display stats. Do not label derived values as
on-chain values.

Evolution flow: 1. Show next requirement. 2. Explain eligibility. 3.
Preview paths. 4. User selects a path. 5. User approves the Solana
transaction. 6. App confirms and fetches updated state. 7. Creature
displays the new form and reacts.

Never show evolution as complete before confirmation.

## 7. Creature stat card / collectible ticket

Create a distinctive creature identity card that can be viewed, printed,
and shared via stable URL or image export if feasible.

Include: - Chainkin branding. - Creature artwork. - Name and species. -
Shortened owner wallet. - Level and XP. - Evolution stage/path. -
Personality summary. - Key stats/traits. - Verifiable Devnet
account/transaction reference where practical. - Clear Devnet label.

Use real data only.

Print stylesheet: - Hide navigation and interactive controls. - Use a
deliberate card/portrait layout. - Preserve artwork and typography. -
Avoid splitting the card across pages.

If image export is practical with existing dependencies, implement it.
Otherwise prioritize print view and a shareable route. Do not add NFT
minting just to make the card collectible.

## 8. Visual design and interaction

### Navigation

-   Floating, centered top navigation.
-   Rounded/pill-like surface with deliberate styling.
-   Not attached to viewport top edge.
-   No generic sidebar.
-   Clear active-page state.
-   Responsive on narrow screens.

### Transitions

-   Smooth page changes.
-   Subtle fade/slide or shared-element transitions where suitable.
-   Creature interaction feedback.
-   Loading and transaction states.
-   Evolution reveal animation.

Animations must not block interaction or destabilize layout. Respect
`prefers-reduced-motion`.

### Game-like presentation

-   Creature remains visually prominent.
-   Progression is easy to understand.
-   Mood/personality are readable.
-   Actions feel responsive.
-   Important events receive visual feedback.
-   Interface remains legible.

Avoid generic admin layouts, empty statistic cards, fake activity feeds,
excessive glow/blur, dead buttons, and over-animated navigation.

## 9. Playwright browser QA

Use installed Playwright skills/CLI if available. Read the actual skill
instructions and check installed command syntax; do not assume a slash
command exists.

Test: 1. Disconnected welcome screen. 2. Wallet connection. 3. Correct
active wallet display. 4. Existing creature load or new creature
awakening. 5. Creature page and real state. 6. Talk, Ponder, Comfort,
Observe. 7. Visible dialogue update after successful response. 8.
Loading/error behavior. 9. Ritual and confirmed state refresh. 10.
Evolution eligibility and transaction handling. 11. Return to
collection. 12. Wallet switching and collection refresh. 13.
Print/stat-card layout. 14. Responsive layouts. 15. Console errors and
failed network requests.

Do not burn AI quota on every browser test. Use deterministic mocked AI
responses for repeatable UI regression tests, plus a small number of
deliberate live-provider smoke tests.

Never use a real wallet seed phrase in test scripts. Use an approved
Devnet test wallet and normal wallet approval for live transaction
checks.

Capture screenshots of important screens. Report exactly which tests ran
and which did not.

## 10. YouTube product demo video

After the application is stable, create a polished YouTube demo.

### Preferred renderer: Remotion

The app is already React/Next.js, so prefer **Remotion** for the video
composition. Do not install both Remotion and HyperFrames without a
concrete reason. HyperFrames is an acceptable alternative if existing
skills/setup make it materially easier, but choose one workflow.

Before implementation: - Read installed Remotion skill instructions and
relevant official documentation. - Check current licensing requirements
for the intended use. - Inspect the project structure. - Isolate video
tooling in a dedicated directory or separate project if adding it to the
app risks destabilizing the application. - Do not compromise the working
app for video dependencies.

### Video target

-   YouTube.
-   MP4 / H.264.
-   1920 × 1080.
-   16:9.
-   30 fps.
-   Approximately 60--90 seconds.
-   Captions/readable on-screen text.
-   Music only when licensed for the intended upload.
-   Text inside safe margins.

### Suggested storyboard

**Scene 1 --- Hook (0--6s):** Chainkin identity and "A companion that
grows with you."

**Scene 2 --- Wallet and identity (6--16s):** Real wallet connection and
home/collection; explain wallet-linked creatures.

**Scene 3 --- Meet the creature (16--28s):** Real creature page,
species, personality, stats, mood.

**Scene 4 --- AI interaction (28--43s):** Real user interaction and
actual generated response; show personality/context.

**Scene 5 --- Progression/evolution (43--60s):** Real ritual/progression
and a confirmed evolution if available. Never fake a transaction or
milestone.

**Scene 6 --- Collection/stat card (60--75s):** Show implemented
collection management and stat card/print/share feature. If
multi-creature support is deferred, do not show fake multi-creature
behavior.

**Scene 7 --- Closing (75--90s):** Chainkin identity, one-sentence
description, repository URL, Devnet/hackathon context.

Adjust the storyboard to completed features only.

### Production workflow

1.  Use Playwright to verify the final application and capture real
    browser footage/screenshots.
2.  Use Remotion to assemble footage, titles, captions, transitions, and
    explanatory graphics.
3.  Use deterministic frame-based animation for timeline-critical
    elements.
4.  Preview the full composition.
5.  Check legibility, timing, aspect ratio, and audio.
6.  Render MP4.
7.  Verify the file exists, plays, and has expected duration/resolution.
8.  Save source compositions/assets with the video project.
9.  Report exact output path and render command.

The video must demonstrate the real product. Do not use mockups to imply
unfinished features work.

## 11. Secrets and environment

Inspect existing `.env.example` and configuration.

-   Keep provider keys server-side.
-   Never use `NEXT_PUBLIC_` for AI secrets.
-   Do not print secret values in logs/reports.
-   Document variable names and purposes only.
-   Do not overwrite local `.env.local`.
-   Never commit secrets.

## 12. Acceptance checklist

### Product

-   [ ] Home explains Chainkin and handles disconnected/connected
    states.
-   [ ] Floating centered top navigation works and is responsive.
-   [ ] Wallet switching displays the correct wallet's data.
-   [ ] Collection displays only real discovered creatures.
-   [ ] Existing creature page remains functional.
-   [ ] Multi-creature-per-wallet is implemented only if on-chain
    PDA/discovery design is safe; otherwise limitation is explicit.

### AI

-   [ ] Talk, Ponder, Comfort, and Observe each produce visible
    responses.
-   [ ] Species personalities are meaningfully distinct.
-   [ ] Traits, mood, level, evolution, and recent interaction inform
    context.
-   [ ] Successful transactions produce a contextual reaction using
    refreshed state.
-   [ ] Failed/rejected transactions never produce success reactions.
-   [ ] Invalid model output is handled safely.
-   [ ] Fallback mode is clearly identified.
-   [ ] Configurable request budget defaults to 35/day, reserving
    capacity from the 50/day provider allowance.

### Progression

-   [ ] Level 3, 7, and 15 milestones work.
-   [ ] Species have data-driven evolution paths.
-   [ ] Evolution is not complete before confirmation.
-   [ ] Artwork/stat limitations are documented honestly.

### Sharing

-   [ ] Stat card uses real data.
-   [ ] Print layout works.
-   [ ] Share route/export works if implemented.

### Quality and demo

-   [ ] No critical browser console errors in the main journey.
-   [ ] No major broken controls.
-   [ ] Existing and relevant new tests pass.
-   [ ] Playwright flows are executed and reported.
-   [ ] Existing Devnet functionality is preserved.
-   [ ] Real app footage is captured.
-   [ ] Video is previewed, rendered, and verified.
-   [ ] YouTube-ready 1080p 16:9 MP4 exists.
-   [ ] Video only demonstrates implemented features.

## 13. Execution order

### Phase 0 --- Audit

Inspect branch/working tree/docs/app. Verify Solana flow. Diagnose AI
request-to-render bug. Determine multi-creature PDA feasibility and
risk. Produce a concise plan.

### Phase 1 --- Repair AI

Fix request-to-render. Add structured context, validated responses,
distinct species behavior, quota protection, fallback. Verify all
interactions.

### Phase 2 --- Application shell

Build home, floating navigation, page transitions, wallet switching, and
collection. Preserve the existing creature page.

### Phase 3 --- Progression/evolution

Implement levels 3, 7, and 15. Define species-specific paths. Make
on-chain changes only after architecture verification. Add eligibility
and transaction feedback.

### Phase 4 --- Stat card

Build real-data stat card, print styling, and sharing/export if
feasible.

### Phase 5 --- QA

Run existing checks and Playwright end-to-end flows. Fix critical
defects. Capture real screenshots and demo footage.

### Phase 6 --- Video

Use Remotion as preferred renderer. Build the 60--90 second YouTube
composition. Preview, render, and verify MP4.

### Phase 7 --- Final report

Return: 1. Implemented features. 2. Deferred features and reasons. 3.
Important architecture decisions. 4. Files changed. 5. Commands run and
actual results. 6. AI provider configuration and request-budget
behavior. 7. Solana/Devnet status. 8. Playwright test results. 9. Known
issues. 10. Exact video output path and render command. 11. Short manual
demo script.

**Final instruction:** Prioritize a complete, reliable user journey over
feature count. If a feature threatens the existing Solana functionality
or deadline, defer it transparently. Never fake functionality to satisfy
a checklist.
