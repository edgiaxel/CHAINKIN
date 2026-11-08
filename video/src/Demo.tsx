import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
  staticFile,
} from "remotion";

const BG_COLOR = "#090d16";
const ACCENT_CYAN = "#38bdf8";
const ACCENT_PURPLE = "#a855f7";
const ACCENT_EMERALD = "#34d399";
const ACCENT_AMBER = "#fbbf24";

// Scene 1: Hook & Brand Intro (0 - 6s)
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 12 } });
  const subtitleProgress = spring({ frame: frame - 25, fps, config: { damping: 14 } });
  const badgeProgress = spring({ frame: frame - 10, fps, config: { damping: 15 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        position: "relative",
      }}
    >
      {/* Background radial aura */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Pill Badge */}
      <div
        style={{
          transform: `scale(${badgeProgress})`,
          opacity: badgeProgress,
          padding: "10px 24px",
          borderRadius: 9999,
          background: "rgba(8, 47, 73, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.6)",
          color: ACCENT_CYAN,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "monospace",
          letterSpacing: 2,
          marginBottom: 30,
        }}
      >
        SOLANA DEVNET COMPANION
      </div>

      {/* Main Title */}
      <h1
        style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: -2,
          margin: 0,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
          opacity: titleProgress,
          background: "linear-gradient(to right, #ffffff, #cbd5e1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        CHAINKIN
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 38,
          color: "#94a3b8",
          marginTop: 20,
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.4,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [30, 0])}px)`,
          opacity: subtitleProgress,
        }}
      >
        Something alive lives on your chain.
        <br />
        <span style={{ color: ACCENT_CYAN, fontWeight: 700 }}>
          A living digital companion that grows with you.
        </span>
      </p>
    </div>
  );
};

// Scene 2: Wallet & Identity Architecture (6 - 16s)
const Scene2Wallet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 15 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "80px 120px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, paddingRight: 60, opacity: fadeIn }}>
        <div
          style={{
            fontSize: 20,
            color: ACCENT_EMERALD,
            fontWeight: 800,
            fontFamily: "monospace",
            marginBottom: 16,
          }}
        >
          [ON-CHAIN ARCHITECTURE]
        </div>
        <h2 style={{ fontSize: 56, fontWeight: 900, margin: 0, lineHeight: 1.15 }}>
          One Wallet.
          <br />
          One Living PDA.
        </h2>
        <p style={{ fontSize: 24, color: "#94a3b8", marginTop: 24, lineHeight: 1.6 }}>
          Chainkin bonds deterministically to your Solana Devnet address via Program Derived Address seeds:
        </p>
        <div
          style={{
            padding: "16px 24px",
            background: "#030712",
            borderRadius: 16,
            border: "1px solid #1e293b",
            fontFamily: "monospace",
            color: ACCENT_CYAN,
            fontSize: 22,
            marginTop: 16,
            display: "inline-block",
          }}
        >
          [b&quot;creature&quot;, owner_pubkey]
        </div>
        <p style={{ fontSize: 20, color: "#64748b", marginTop: 20 }}>
          Authoritative on-chain ownership. Private keys are never touched.
        </p>
      </div>

      <div
        style={{
          flex: 1.2,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          border: "2px solid #1e293b",
          transform: `scale(${interpolate(fadeIn, [0, 1], [0.95, 1])})`,
          opacity: fadeIn,
        }}
      >
        <Img src={staticFile("01-welcome-home.png")} style={{ width: "100%", height: "auto" }} />
      </div>
    </div>
  );
};

// Scene 3: Meet the Archetypes & Traits (16 - 28s)
const Scene3Archetypes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });

  const archetypes = [
    {
      name: "Wisp",
      type: "Ethereal & Poetic",
      desc: "Drifts through validator blocks, tuning to network frequencies.",
      color: "#38bdf8",
      traits: "Curiosity 12 • Empathy 10",
    },
    {
      name: "Bytebeast",
      type: "Mechanical & Dynamo",
      desc: "Reclaims discarded bytecode and overclocks its clockwork core.",
      color: "#fbbf24",
      traits: "Courage 12 • Ingenuity 10",
    },
    {
      name: "Mossling",
      type: "Ancient & Verdant",
      desc: "Rooted deep into immutable ledger soil and solar energy.",
      color: "#34d399",
      traits: "Empathy 13 • Courage 8",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 100px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 50, opacity: enter }}>
        <span style={{ color: ACCENT_CYAN, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          COMPANION LINEAGES
        </span>
        <h2 style={{ fontSize: 52, fontWeight: 900, margin: "10px 0 0" }}>
          Choose Your Sacred Archetype
        </h2>
        <p style={{ fontSize: 22, color: "#94a3b8", margin: "8px 0 0" }}>
          Each species features a unique voice, behavioral cadence, and on-chain base traits.
        </p>
      </div>

      <div style={{ display: "flex", gap: 32, width: "100%", maxWidth: 1400 }}>
        {archetypes.map((arch, idx) => {
          const cardSpring = spring({ frame: frame - idx * 10, fps, config: { damping: 15 } });
          return (
            <div
              key={arch.name}
              style={{
                flex: 1,
                padding: 36,
                borderRadius: 24,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: `2px solid ${arch.color}40`,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                transform: `translateY(${interpolate(cardSpring, [0, 1], [50, 0])}px)`,
                opacity: cardSpring,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: `${arch.color}20`,
                  border: `1px solid ${arch.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  color: arch.color,
                }}
              >
                #{idx}
              </div>
              <h3 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "#ffffff" }}>
                {arch.name}
              </h3>
              <span style={{ fontSize: 18, color: arch.color, fontWeight: 600 }}>{arch.type}</span>
              <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                {arch.desc}
              </p>
              <div
                style={{
                  marginTop: "auto",
                  padding: "12px 16px",
                  backgroundColor: "#030712",
                  borderRadius: 12,
                  fontSize: 16,
                  fontFamily: "monospace",
                  color: "#cbd5e1",
                  border: "1px solid #1e293b",
                }}
              >
                {arch.traits}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 4: AI Dialogue & Conscious Interaction (28 - 43s)
const Scene4Dialogue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  const modes = [
    { label: "Talk", desc: "Converse about journey & Solana cluster state" },
    { label: "Ponder", desc: "Deep cryptographic philosophical contemplation" },
    { label: "Comfort", desc: "Empathetic emotional reassurance & soothing warmth" },
    { label: "Observe", desc: "Scan ambient validator mempool telemetry" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 100px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40, opacity: enter }}>
        <span style={{ color: ACCENT_PURPLE, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          INTELLIGENT COMPANIONSHIP
        </span>
        <h2 style={{ fontSize: 52, fontWeight: 900, margin: "10px 0 0" }}>
          Responsive AI Dialogue Consciousness
        </h2>
        <p style={{ fontSize: 22, color: "#94a3b8", margin: "8px 0 0" }}>
          Trait-informed speech, internal thoughts, and keeper perceptions.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          padding: 40,
          borderRadius: 28,
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          border: "2px solid rgba(56, 189, 248, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          opacity: enter,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Dialogue header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, color: "#94a3b8", fontWeight: 700 }}>MOOD:</span>
            <span
              style={{
                fontSize: 16,
                padding: "6px 16px",
                borderRadius: 9999,
                backgroundColor: "rgba(8, 47, 73, 0.9)",
                border: "1px solid rgba(56, 189, 248, 0.6)",
                color: ACCENT_CYAN,
                fontWeight: 700,
              }}
            >
              Transcendent & Attuned
            </span>
          </div>

          <span
            style={{
              fontSize: 16,
              color: ACCENT_EMERALD,
              fontFamily: "monospace",
              backgroundColor: "rgba(6, 78, 59, 0.5)",
              padding: "6px 14px",
              borderRadius: 9999,
              border: "1px solid rgba(16, 185, 129, 0.5)",
            }}
          >
            ● Live Provider AI Engine
          </span>
        </div>

        {/* Speech Bubble */}
        <div
          style={{
            padding: "24px 30px",
            backgroundColor: "#030712",
            borderRadius: 20,
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: 14, color: ACCENT_CYAN, fontWeight: 800, fontFamily: "monospace" }}>
            LUMIS SPEAKS:
          </div>
          <p
            style={{
              fontSize: 28,
              fontStyle: "italic",
              color: "#f8fafc",
              margin: "10px 0 0",
              lineHeight: 1.4,
            }}
          >
            &ldquo;Our connection clarifies the whispers between distant validator nodes. The cluster feels serene today.&rdquo;
          </p>
        </div>

        {/* 4 Interaction Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 10 }}>
          {modes.map((m) => (
            <div
              key={m.label}
              style={{
                padding: 18,
                borderRadius: 16,
                backgroundColor: "rgba(2, 6, 23, 0.8)",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT_CYAN }}>{m.label}</span>
              <span style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.3 }}>{m.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scene 5: Progression & Evolution Milestones (43 - 60s)
const Scene5Progression: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  const tiers = [
    {
      level: "Level 3",
      title: "Stage 1: Awakening Specialization",
      desc: "Unlocks dedicated evolutionary branch choice on Solana Devnet.",
      status: "Unlocked",
      color: ACCENT_EMERALD,
    },
    {
      level: "Level 7",
      title: "Stage 2: Harmonic Resonance",
      desc: "Advanced ledger harmony channeling deeper validator attunement.",
      status: "Upcoming",
      color: ACCENT_PURPLE,
    },
    {
      level: "Level 15",
      title: "Stage 3: Transcendent Apex",
      desc: "The ultimate form embodying permanent Solana consensus mastery.",
      status: "Apex Form",
      color: ACCENT_AMBER,
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 100px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 50, opacity: enter }}>
        <span style={{ color: ACCENT_AMBER, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          VERIFIABLE PROGRESSION
        </span>
        <h2 style={{ fontSize: 52, fontWeight: 900, margin: "10px 0 0" }}>
          Daily Rituals &amp; Evolution Milestones
        </h2>
        <p style={{ fontSize: 22, color: "#94a3b8", margin: "8px 0 0" }}>
          Bond (+30 XP) and Explore (+40 XP) rituals directly commit state to Solana Devnet.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 1100 }}>
        {tiers.map((t, idx) => {
          const itemSpring = spring({ frame: frame - idx * 12, fps, config: { damping: 14 } });
          return (
            <div
              key={t.level}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 32px",
                borderRadius: 20,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: `2px solid ${t.color}50`,
                transform: `translateX(${interpolate(itemSpring, [0, 1], [-40, 0])}px)`,
                opacity: itemSpring,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div
                  style={{
                    padding: "10px 18px",
                    borderRadius: 14,
                    backgroundColor: `${t.color}20`,
                    border: `1px solid ${t.color}`,
                    color: t.color,
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: "monospace",
                  }}
                >
                  {t.level}
                </div>
                <div>
                  <h4 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{t.title}</h4>
                  <p style={{ fontSize: 16, color: "#94a3b8", margin: "4px 0 0" }}>{t.desc}</p>
                </div>
              </div>

              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: t.color,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  backgroundColor: `${t.color}15`,
                }}
              >
                {t.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 6: Collection & Stat Card Showcase (60 - 74s)
const Scene6CollectionCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 15 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "80px 120px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, paddingRight: 60, opacity: fadeIn }}>
        <div
          style={{
            fontSize: 20,
            color: ACCENT_PURPLE,
            fontWeight: 800,
            fontFamily: "monospace",
            marginBottom: 16,
          }}
        >
          [COLLECTION &amp; PASSPORT]
        </div>
        <h2 style={{ fontSize: 54, fontWeight: 900, margin: 0, lineHeight: 1.15 }}>
          Printable Passport
          <br />
          &amp; Watch-Only Lists
        </h2>
        <p style={{ fontSize: 24, color: "#94a3b8", marginTop: 24, lineHeight: 1.6 }}>
          Export real creature credentials as a printable physical stat card. Inspect companions across multiple wallets on Devnet.
        </p>

        <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              color: "#e9d5ff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            ✓ Print to PDF
          </div>
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(56, 189, 248, 0.2)",
              border: "1px solid rgba(56, 189, 248, 0.5)",
              color: "#bae6fd",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            ✓ Multi-Wallet Watcher
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1.2,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          border: "2px solid #334155",
          transform: `scale(${interpolate(fadeIn, [0, 1], [0.95, 1])})`,
          opacity: fadeIn,
        }}
      >
        <Img src={staticFile("03-collection-multiwallet.png")} style={{ width: "100%", height: "auto" }} />
      </div>
    </div>
  );
};

// Scene 7: Outro & Hackathon Credentials (74 - 80s)
const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${enter})`,
          opacity: enter,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, #38bdf8, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 900,
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(56, 189, 248, 0.4)",
          }}
        >
          CK
        </div>

        <h1 style={{ fontSize: 72, fontWeight: 900, margin: 0, letterSpacing: -1 }}>
          CHAINKIN
        </h1>

        <p style={{ fontSize: 28, color: "#94a3b8", maxWidth: 700, margin: 0 }}>
          Wallet-Linked AI Creature Companion on Solana Devnet
        </p>

        <div
          style={{
            marginTop: 20,
            padding: "16px 36px",
            borderRadius: 9999,
            backgroundColor: "#030712",
            border: "1px solid #1e293b",
            fontSize: 22,
            fontFamily: "monospace",
            color: ACCENT_CYAN,
          }}
        >
          https://github.com/edgiaxel/CHAINKIN
        </div>

        <span style={{ fontSize: 18, color: "#64748b", marginTop: 10 }}>
          Solana Devnet Hackathon Submission • MIT License
        </span>
      </div>
    </div>
  );
};

// Main Storyboard Composition
export const Demo: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: BG_COLOR }}>
      {/* Scene 1: Hook (0 - 6s, 180 frames) */}
      <Sequence from={0} durationInFrames={180}>
        <Scene1Hook />
      </Sequence>

      {/* Scene 2: Wallet & Identity (6 - 16s, 300 frames) */}
      <Sequence from={180} durationInFrames={300}>
        <Scene2Wallet />
      </Sequence>

      {/* Scene 3: Meet Archetypes (16 - 28s, 360 frames) */}
      <Sequence from={480} durationInFrames={360}>
        <Scene3Archetypes />
      </Sequence>

      {/* Scene 4: AI Dialogue (28 - 43s, 450 frames) */}
      <Sequence from={840} durationInFrames={450}>
        <Scene4Dialogue />
      </Sequence>

      {/* Scene 5: Progression & Evolution (43 - 60s, 510 frames) */}
      <Sequence from={1290} durationInFrames={510}>
        <Scene5Progression />
      </Sequence>

      {/* Scene 6: Collection & Stat Card (60 - 74s, 420 frames) */}
      <Sequence from={1800} durationInFrames={420}>
        <Scene6CollectionCard />
      </Sequence>

      {/* Scene 7: Outro & Repo (74 - 80s, 180 frames) */}
      <Sequence from={2220} durationInFrames={180}>
        <Scene7Outro />
      </Sequence>
    </div>
  );
};
