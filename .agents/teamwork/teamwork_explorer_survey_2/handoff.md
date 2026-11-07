# Frontend UI & Architecture Survey (Survey 2) — Handoff Report

## 1. Observation

### Codebase Inventory & Directory Structure
- Frontend source files are located in `app/`, `components/`, `lib/`, and `tests/`:
  - `app/layout.tsx` (lines 1-32): Wraps app in `WalletProvider`, `NetworkBanner`, and `<main>`.
  - `app/page.tsx` (lines 1-249): Main single-page application orchestrating wallet state, PDA fetch, hatch flow, creature dashboard, dialogue box, ritual panel, and evolution modal.
  - `app/globals.css` (lines 1-29): Background color (`#090d16`), radial gradient, `.creature-glow` keyframe animation.
  - `app/api/creature/dialogue/route.ts` (lines 1-103): Server-side dialogue generation endpoint.
  - `app/api/creature/evolution/route.ts` (lines 1-96): Server-side evolution narrative generation endpoint.
  - `components/wallet/WalletProvider.tsx` (lines 1-47): Configures Solana `ConnectionProvider`, `SolanaWalletProvider`, and `WalletModalProvider` with `PhantomWalletAdapter` and `SolflareWalletAdapter`.
  - `components/wallet/NetworkBanner.tsx` (lines 1-41): Fixed header banner showing `Network: DEVNET` and a direct link to `https://faucet.solana.com`.
  - `components/wallet/WalletButton.tsx` (lines 1-18): SSR-disabled dynamic wrapper for `@solana/wallet-adapter-react-ui` `WalletMultiButton`.
  - `components/creature/CreatureAvatar.tsx` (lines 1-194): Pure SVG graphics and CSS animations for Wisp (id: 0), Bytebeast (id: 1), and Mossling (id: 2), including evolved variations.
  - `components/creature/TraitBar.tsx` (lines 1-51): Visual grid showing Curiosity (sky), Courage (amber), Empathy (rose), and Ingenuity (emerald).
  - `components/creature/DialogueBox.tsx` (lines 1-88): Displays mood tag, speech quote, internal thought, narrative insight, and refresh button.
  - `components/creature/RitualPanel.tsx` (lines 1-216): Buttons for "Observe" (free/off-chain), "Bond" (on-chain +30 XP), and "Explore" (on-chain +40 XP), with Devnet transaction status and Solana Explorer link.
  - `components/creature/HatchModal.tsx` (lines 1-230): Archetype selector, creature naming input (max 32 chars), PDA initialization transaction builder, and Devnet confirmation.
  - `components/creature/EvolutionModal.tsx` (lines 1-243): Displays 2 allowlisted evolutionary paths per species, initiates `evolve` instruction, and presents celebration card with narrative flavor text.
  - `components/creature/CreatureCard.tsx` (lines 1-172): Main dashboard hero card showing name, level, XP progress bar, traits, on-chain PDA address, ritual count, slot number, and evolution trigger button.
  - `lib/creature/types.ts` (lines 1-209): Shared schemas and metadata (`SPECIES_CATALOG`, `RITUAL_CATALOG`, `EVOLUTION_CATALOG`, `CreatureStateSchema`).
  - `lib/solana/pda.ts` (lines 1-27): `DEVNET_RPC_URL`, `DEFAULT_PROGRAM_ID` (`DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`), and `findCreaturePda(owner)`.
  - `lib/solana/connection.ts` (lines 1-21): Cached `Connection` and explorer URL formatters.
  - `lib/solana/coder.ts` (lines 1-139): Pure TypeScript SHA256 sighash generator, instruction encoders, and 111-byte account decoder.
  - `lib/solana/transactions.ts` (lines 1-133): `fetchCreatureAccount`, `createInitializeCreatureTx`, `createPerformRitualTx`, `createEvolveTx`.
  - `lib/ai/types.ts`, `lib/ai/client.ts`, `lib/ai/fallback.ts`: Dialogue schemas, HTTP client, and deterministic fallback data.
- **Directories not present**: `hooks/`, `styles/`, and `public/` do not currently exist in the repository.

### Existing Creature Presentation
1. **Stage**:
   - Stored on-chain as `evolutionStage: u8` and `evolutionChoice: u8`.
   - In `CreatureCard.tsx:68-73`, if `evolutionStage > 0`, an evolved badge is displayed (`Sparkles` icon with the evolution choice name, e.g., "Astral Guide", "Cyber Warden", "Elder Arbor").
2. **Stats (Level & XP)**:
   - Displayed as badges in `CreatureCard.tsx:81-87`: `Level {level}` and `{xp} XP`.
   - XP progress bar (`CreatureCard.tsx:104-117`) calculates progress percentage toward the next level threshold: L1 (0–39 XP), L2 (40–99 XP), L3 (100–199 XP), L4 (200+ XP).
3. **Traits**:
   - 4-trait matrix in `TraitBar.tsx`: Curiosity, Courage, Empathy, Ingenuity, each displaying value and a progress bar scaled to 40.
4. **Cooldown / Slots**:
   - `lastActionSlot` is fetched from the on-chain account and displayed at `CreatureCard.tsx:166` (`Slot: {creature.lastActionSlot}`). No client-side artificial delay blocks interactions; buttons are disabled during active transaction signing/confirmation.
5. **Rituals**:
   - `RitualPanel.tsx` displays total rituals count (`creature.ritualCount`).
   - "Observe": Free off-chain action triggering fresh dialogue thoughts.
   - "Bond": On-chain transaction executing instruction `perform_ritual(1)`, granting +30 XP, +2 Curiosity, +3 Empathy.
   - "Explore": On-chain transaction executing instruction `perform_ritual(2)`, granting +40 XP, +3 Courage, +2 Ingenuity.
   - Feedback: Displays loading spinners, "Confirming on Devnet...", explorer link to `https://explorer.solana.com/tx/${signature}?cluster=devnet`, success alerts, and cancellation warnings.

### Wallet Connection & Signing Flow
- **Provider**: `components/wallet/WalletProvider.tsx` connects to Solana Devnet (`https://api.devnet.solana.com`).
- **Supported Wallets**: Phantom and Solflare via official wallet adapter adapters.
- **Key Safety**: The application never accesses private keys or seed phrases; all transactions are passed to `wallet.sendTransaction(transaction, connection)`.
- **Anchor Integration**: Custom pure TypeScript coder in `lib/solana/coder.ts` using Node `crypto.createHash("sha256")` for sighash calculation (`global:initialize_creature`, `global:perform_ritual`, `global:evolve`, `account:Creature`). Decodes the exact binary layout (discriminator, owner pubkey, creature_id hex, species u8, name u32+bytes, level u8, xp u32, traits 4xu8, ritual_count u16, evolution_stage u8, evolution_choice u8, last_action_slot u64, bump u8).

### Responsiveness & Design System
- **Styling**: Tailwind CSS with custom colors (`background: #090d16`, `foreground: #f1f5f9`), glassmorphic panels (`bg-slate-900/80`, `backdrop-blur-xl`, `border-cyan-800/40`), and glow effects (`.creature-glow`).
- **Responsive Breakpoints**: Extensive use of `sm:` breakpoints for grid reflows (e.g. 1 column on mobile to 3 columns on desktop for rituals, 2 columns for traits, responsive creature avatar scaling from `w-44 h-44` to `w-52 h-52`).
- **UI States Handled**:
  - Wallet disconnected landing screen (`app/page.tsx:117-174`)
  - Wallet scanning creature PDA (`app/page.tsx:177-189`)
  - First-time hatch modal (`app/page.tsx:192-199`)
  - Active companion dashboard (`app/page.tsx:202-235`)
  - Evolution modal and celebration dialog (`components/creature/EvolutionModal.tsx:103-241`)
  - Transaction signing, confirming, explorer link, and wallet rejection alerts.

### Verification of Existing Frontend Scripts
- `npm run typecheck` (`tsc --noEmit`):
  ```
  > chainkin@0.1.0 typecheck
  > tsc --noEmit
  (Exited 0 with 0 errors)
  ```
- `npm run lint` (`next lint`):
  ```
  ✔ No ESLint warnings or errors
  (Exited 0 with 0 warnings, 0 errors)
  ```
- `npm test` (`vitest run`):
  ```
  Test Files  3 passed (3)
       Tests  14 passed (14)
    Duration  1.37s
  ```
- `npm run build` (`next build`):
  ```
  ✓ Compiled successfully
  ✓ Linting and checking validity of types
  ✓ Collecting page data
  ✓ Generating static pages (4/4)
  ✓ Collecting build traces
  ✓ Finalizing page optimization
  Routes: / (154 kB), /_not-found (875 B), /api/creature/dialogue, /api/creature/evolution
  ```

---

## 2. Logic Chain

1. **Safety and Integrity Constraints**:
   - `AGENTS.md` and `docs/TECHNICAL_ARCHITECTURE.md` strictly require keeping on-chain state authoritative, avoiding wallet private key access, isolating AI generation server-side, and preserving existing Devnet MVP capabilities.
2. **Current Frontend Coupling**:
   - Currently, `app/page.tsx` directly imports and wires all subcomponents (`CreatureCard`, `DialogueBox`, `RitualPanel`, `HatchModal`, `EvolutionModal`, `CreatureAvatar`).
   - `lib/solana/transactions.ts` and `lib/solana/coder.ts` are completely decoupled from UI presentation; they produce standard Solana `Transaction` objects and receive `wallet.publicKey`.
   - `DialogueBox.tsx` currently displays static fields (`mood`, `speech`, `thought`, `narrativeInsight`) and has a simple refresh button calling `onRefresh`.
3. **Integration Points for Personality & Interactive Dialogue**:
   - `DialogueBox.tsx` can be upgraded to an interactive dialogue interface (e.g. user dialogue responses, dialogue history, conversational interaction prompt) without modifying transaction signing or PDA logic.
   - `TraitBar.tsx` can visually reflect dominant personality traits, archetype affinities, or emotional resonance meters.
   - `CreatureAvatar.tsx` can add subtle mood-based animations or trait-reactive visual flourishes (e.g., eye shifts, particle effects) while keeping the base SVG intact.
   - `EvolutionModal.tsx` can feature enhanced particle effects and stage transformation presentation during the ascend flow.
4. **Decoupling Boundaries**:
   - Because `app/api/creature/*` and `lib/ai/*` handle prompt generation and external API calls (Agent A), Agent B can focus entirely on presentation components (`components/creature/*`, `app/page.tsx`, `app/globals.css`).

---

## 3. Caveats

- **No Public/Assets Directory**: There is currently no `public/` folder with favicon, manifest, or static images; all graphics are SVGs inline in `CreatureAvatar.tsx`. If custom raster assets or audio are introduced, a `public/` directory should be created.
- **Node Crypto in Browser vs Server**: `lib/solana/coder.ts` uses `crypto.createHash("sha256")`. In Next.js App Router Webpack configuration, this is supported for client components, but any new client-side hashing should be careful not to introduce unsupported Node native modules.
- **RPC Rate Limits**: The Devnet endpoint is currently `https://api.devnet.solana.com`, which occasionally rate-limits public faucet requests or batch account queries. The UI should always handle `fetchCreatureAccount` failures gracefully with existing cached state.

---

## 4. Conclusion

The frontend architecture is robust, strictly typed, passes all linting, typechecks, Vitest tests, and production Next.js builds.

### Explicit Workstream Boundaries for Agent B (Creature Experience)

| Workstream | Explicit File Ownership | Read-Only / Consumed Interfaces |
|------------|-------------------------|---------------------------------|
| **Agent B (Creature Experience)** | - `components/creature/CreatureAvatar.tsx`<br>- `components/creature/TraitBar.tsx`<br>- `components/creature/DialogueBox.tsx`<br>- `components/creature/CreatureCard.tsx`<br>- `components/creature/EvolutionModal.tsx`<br>- `components/creature/HatchModal.tsx`<br>- `components/creature/RitualPanel.tsx`<br>- `app/page.tsx`<br>- `app/globals.css` | - `lib/creature/types.ts` (`CreatureState`, `SPECIES_CATALOG`, `EVOLUTION_CATALOG`, `RITUAL_CATALOG`)<br>- `lib/ai/types.ts` (`DialogueResponse`, `EvolutionNarrativeResponse`)<br>- `lib/ai/client.ts` (`fetchCreatureDialogue`, `fetchEvolutionNarrative`)<br>- `lib/solana/*` (`fetchCreatureAccount`, `createPerformRitualTx`, etc.)<br>- `components/wallet/*` (`WalletButton`, `NetworkBanner`) |
| **Agent A (AI Engineering)** | - `app/api/creature/dialogue/route.ts`<br>- `app/api/creature/evolution/route.ts`<br>- `lib/ai/types.ts`<br>- `lib/ai/client.ts`<br>- `lib/ai/fallback.ts`<br>- New AI modules (`lib/ai/openrouter.ts`, `lib/ai/rateLimit.ts`)<br>- AI tests (`tests/ai.test.ts`) | - `lib/creature/types.ts` |
| **Agent C (Solana Security)** | - Audit reports only (read-only review of `programs/chainkin/*`, `lib/solana/*`, and on-chain constraints) | All repository files |

Agent B can immediately enhance creature visuals, personality UI, interactive dialogue responses, and evolution presentation in `components/creature/*` and `app/page.tsx` without risking regressions in the Solana wallet adapter or transaction signing pipeline.

---

## 5. Verification Method

To independently verify the frontend state and codebase health, execute the following commands in `/home/axel/Development/CHAINKIN`:

```bash
# 1. Typecheck
npm run typecheck

# 2. Lint
npm run lint

# 3. Vitest unit and integration suite
npm test

# 4. Production build
npm run build
```

Expected outputs:
- `npm run typecheck` exits with code 0 and 0 errors.
- `npm run lint` outputs `✔ No ESLint warnings or errors` and exits with code 0.
- `npm test` passes all 3 test files and 14 tests in under 2 seconds.
- `npm run build` compiles 4 routes (`/`, `/_not-found`, `/api/creature/dialogue`, `/api/creature/evolution`) without errors.
