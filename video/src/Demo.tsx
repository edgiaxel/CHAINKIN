import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
  Audio,
  OffthreadVideo,
  staticFile,
} from "remotion";

const BG_COLOR = "#070b14";
const ACCENT_CYAN = "#38bdf8";
const ACCENT_PURPLE = "#c084fc";
const ACCENT_EMERALD = "#34d399";
const ACCENT_AMBER = "#fbbf24";

// Subtitle Caption Bar Component
const SubtitleBar: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "14px 28px",
          borderRadius: 9999,
          backgroundColor: "rgba(3, 7, 18, 0.92)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
          color: "#f8fafc",
          fontSize: 22,
          fontWeight: 600,
          textAlign: "center",
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
          backdropFilter: "blur(12px)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Scene 1: Hook & Brand Intro (0 - 8s, 240 frames)
// Narration: "Meet Chainkin, a wallet-linked digital creature companion built on Solana."
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 12 } });
  const subtitleProgress = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const previewScale = interpolate(frame, [40, 240], [0.95, 1.02], {
    extrapolateRight: "clamp",
  });
  const previewOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Hero Badge */}
      <div
        style={{
          transform: `scale(${titleProgress})`,
          opacity: titleProgress,
          padding: "8px 20px",
          borderRadius: 9999,
          backgroundColor: "rgba(56, 189, 248, 0.12)",
          border: `1px solid ${ACCENT_CYAN}`,
          color: ACCENT_CYAN,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 16,
          zIndex: 10,
        }}
      >
        Solana Devnet Living Companion
      </div>

      {/* Main Title */}
      <h1
        style={{
          transform: `scale(${titleProgress})`,
          opacity: titleProgress,
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          color: "#ffffff",
          margin: "0 0 12px 0",
          zIndex: 10,
          textShadow: "0 0 40px rgba(56, 189, 248, 0.4)",
        }}
      >
        CHAINKIN
      </h1>

      <p
        style={{
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          opacity: subtitleProgress,
          fontSize: 26,
          color: "#94a3b8",
          margin: "0 0 32px 0",
          zIndex: 10,
        }}
      >
        Wallet-Linked Digital Creature Companion
      </p>

      {/* Real Browser Hero Preview */}
      <div
        style={{
          width: 1360,
          height: 640,
          borderRadius: 20,
          overflow: "hidden",
          border: "2px solid rgba(56, 189, 248, 0.35)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
          transform: `scale(${previewScale})`,
          opacity: previewOpacity,
          zIndex: 5,
        }}
      >
        <Img
          src={staticFile("recordings/scene1-hero.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <SubtitleBar text="Meet Chainkin, a wallet-linked digital creature companion built on Solana." />
    </div>
  );
};

// Scene 2: On-Chain Identity & Progression (8 - 20.7s, 380 frames)
// Narration: "Instead of treating blockchain as just a place to store digital assets, Chainkin uses it to give each creature an identity and progression connected to its owner."
const Scene2Identity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 14 } });
  const scrollOffset = interpolate(frame, [0, 380], [0, -180], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 60,
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `translateY(${interpolate(anim, [0, 1], [-20, 0])}px)`,
          opacity: anim,
          textAlign: "center",
          marginBottom: 30,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 9999,
            backgroundColor: "rgba(192, 132, 252, 0.15)",
            border: `1px solid ${ACCENT_PURPLE}`,
            color: ACCENT_PURPLE,
            fontSize: 14,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Authoritative On-Chain Architecture
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: "#ffffff", margin: 0 }}>
          Identity &amp; Progression Bound to Owner
        </h2>
      </div>

      {/* Real Browser Features View with Pan */}
      <div
        style={{
          width: 1440,
          height: 720,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(192, 132, 252, 0.3)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          transform: `translateY(${scrollOffset}px)`,
          zIndex: 5,
        }}
      >
        <Img
          src={staticFile("recordings/scene2-features.png")}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      <SubtitleBar text="Instead of treating blockchain as just a place to store digital assets, Chainkin gives each creature an identity and progression connected to its owner." />
    </div>
  );
};

// Scene 3: Connect Wallet & Awaken (20.7 - 31s, 310 frames)
// Narration: "Start by connecting a Solana wallet on Devnet. From there, you can awaken a creature, give it a name, and enter its own companion space."
const Scene3Awaken: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 14 } });
  const zoom = interpolate(frame, [0, 310], [1.0, 1.05], { extrapolateRight: "clamp" });

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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: anim,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(52, 211, 153, 0.15)",
            border: `1px solid ${ACCENT_EMERALD}`,
            color: ACCENT_EMERALD,
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Solana Devnet Wallet Connection
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: "#ffffff", margin: 0 }}>
          Awaken Your Companion Space
        </h2>
      </div>

      {/* Real Footage of Companion Space Screen */}
      <div
        style={{
          width: 1400,
          height: 680,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(52, 211, 153, 0.35)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          transform: `scale(${zoom})`,
          marginTop: 60,
          zIndex: 10,
        }}
      >
        <Img
          src={staticFile("recordings/scene6-companion.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      <SubtitleBar text="Start by connecting a Solana wallet on Devnet. From there, you can awaken a creature, give it a name, and enter its own companion space." />
    </div>
  );
};

// Scene 4: Species, Traits, Interactions & Rituals (31 - 48.3s, 520 frames)
// Narration: "Every creature has its own species, traits, stats, and personality. You can interact with it through actions like Observe, Talk, and Ponder. You can also perform rituals like Bond and Explore to help it gain experience and progress."
const Scene4Interactions: React.FC = () => {
  const frame = useCurrentFrame();

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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 45,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          zIndex: 20,
        }}
      >
        <span
          style={{
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            border: `1px solid ${ACCENT_CYAN}`,
            color: ACCENT_CYAN,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Observe • Talk • Ponder
        </span>
        <span
          style={{
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(251, 191, 36, 0.15)",
            border: `1px solid ${ACCENT_AMBER}`,
            color: ACCENT_AMBER,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Rituals: Bond (+30 XP) • Explore (+40 XP)
        </span>
      </div>

      {/* Real Browser Video Recording: Journey */}
      <div
        style={{
          width: 1440,
          height: 720,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(56, 189, 248, 0.35)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          marginTop: 50,
          zIndex: 10,
        }}
      >
        <OffthreadVideo
          src={staticFile("recordings/journey.mp4")}
          startFrom={0}
          endAt={500}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <SubtitleBar text="Every creature has its own species, traits, and personality. Interact via Observe, Talk, and Ponder, or perform rituals like Bond and Explore to progress." />
    </div>
  );
};

// Scene 5: Solana Game State + OpenRouter AI Telemetry (48.3 - 69s, 620 frames)
// Narration: "Behind the scenes, Solana handles the important game state, including creature ownership and progression. AI, powered through OpenRouter, generates contextual dialogue and gives each creature a more distinctive way of interacting."
const Scene5SolanaAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_COLOR,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 50,
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          opacity: anim,
          textAlign: "center",
          marginBottom: 24,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 22px",
            borderRadius: 9999,
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            border: `1px solid ${ACCENT_CYAN}`,
            color: ACCENT_CYAN,
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Authoritative State + OpenRouter Engine
        </div>
        <h2 style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", margin: 0 }}>
          Solana Devnet State &amp; AI Safety Telemetry
        </h2>
      </div>

      {/* Real Footage of Settings Screen with Telemetry */}
      <div
        style={{
          width: 1400,
          height: 680,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(56, 189, 248, 0.4)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          zIndex: 10,
        }}
      >
        <Img
          src={staticFile("recordings/scene4-settings.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <SubtitleBar text="Behind the scenes, Solana handles game state and progression on-chain. AI, powered through OpenRouter, generates contextual dialogue and personality." />
    </div>
  );
};

// Scene 6: Evolution Milestones (69 - 77s, 240 frames)
// Narration: "As your creature grows, it can reach evolution milestones and unlock new forms."
const Scene6Evolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 14 } });

  const tiers = [
    { level: "Level 3", stage: "Tier 1: Awakened", xp: "100 XP", desc: "First form divergence" },
    { level: "Level 7", stage: "Tier 2: Resonant", xp: "650 XP", desc: "Trait-dominant evolution" },
    { level: "Level 15", stage: "Tier 3: Transcendent", xp: "3200 XP", desc: "Master companion state" },
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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          opacity: anim,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(192, 132, 252, 0.15)",
            border: `1px solid ${ACCENT_PURPLE}`,
            color: ACCENT_PURPLE,
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Data-Driven Progression Milestones
        </div>
        <h2 style={{ fontSize: 46, fontWeight: 900, color: "#ffffff", margin: 0 }}>
          Evolution Tiers &amp; Unlocked Forms
        </h2>
      </div>

      {/* 3 Evolution Milestones Cards */}
      <div
        style={{
          display: "flex",
          gap: 32,
          zIndex: 10,
        }}
      >
        {tiers.map((t, idx) => {
          const cardAnim = spring({ frame: frame - idx * 15, fps, config: { damping: 12 } });
          return (
            <div
              key={idx}
              style={{
                width: 380,
                padding: "36px 30px",
                borderRadius: 24,
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                border: "2px solid rgba(192, 132, 252, 0.4)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
                transform: `scale(${cardAnim})`,
                opacity: cardAnim,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontFamily: "monospace",
                  fontWeight: 900,
                  color: ACCENT_CYAN,
                }}
              >
                {t.level} ({t.xp})
              </span>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                {t.stage}
              </h3>
              <p style={{ fontSize: 16, color: "#94a3b8", margin: 0 }}>
                {t.desc}
              </p>
            </div>
          );
        })}
      </div>

      <SubtitleBar text="As your creature grows, it can reach evolution milestones at Levels 3, 7, and 15 to unlock new forms." />
    </div>
  );
};

// Scene 7: Printable Stat Card & Provenance (77 - 85.3s, 250 frames)
// Narration: "Chainkin explores a simple idea: what if your on-chain asset wasn't just something you owned, but a digital companion you could grow with?"
const Scene7StatCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 14 } });
  const zoom = interpolate(frame, [0, 250], [1.0, 1.04], { extrapolateRight: "clamp" });

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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: anim,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            border: `1px solid ${ACCENT_CYAN}`,
            color: ACCENT_CYAN,
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Collectible Passport &amp; On-Chain Provenance
        </div>
        <h2 style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", margin: 0 }}>
          Printable Physical Proof Ticket
        </h2>
      </div>

      {/* Real Footage of Stat Card */}
      <div
        style={{
          width: 1360,
          height: 660,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid rgba(56, 189, 248, 0.35)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          transform: `scale(${zoom})`,
          marginTop: 50,
          zIndex: 10,
        }}
      >
        <Img
          src={staticFile("recordings/scene5-card.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      <SubtitleBar text="Chainkin explores a simple idea: what if your on-chain asset wasn't just something you owned, but a digital companion you could grow with?" />
    </div>
  );
};

// Scene 8: Outro & Solana Hackathon Submission (85.3 - 90s, 140 frames)
// Narration: "This is Chainkin, built for the Solana Hackathon."
const Scene8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({ frame, fps, config: { damping: 12 } });
  const outroFade = interpolate(frame, [100, 140], [1, 0], { extrapolateRight: "clamp" });

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
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        opacity: outroFade,
      }}
    >
      <div
        style={{
          transform: `scale(${anim})`,
          opacity: anim,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            padding: "8px 24px",
            borderRadius: 9999,
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            border: `1px solid ${ACCENT_CYAN}`,
            color: ACCENT_CYAN,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Solana Hackathon Submission
        </div>

        <h1
          style={{
            fontSize: 84,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            margin: "8px 0",
            textShadow: "0 0 50px rgba(56, 189, 248, 0.5)",
          }}
        >
          CHAINKIN
        </h1>

        <p style={{ fontSize: 26, color: "#94a3b8", margin: "0 0 24px 0" }}>
          Living AI Creature Companion on Solana Devnet
        </p>

        {/* GitHub Repository Badge */}
        <div
          style={{
            padding: "16px 36px",
            borderRadius: 9999,
            backgroundColor: "#030712",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            fontSize: 24,
            fontFamily: "monospace",
            color: ACCENT_CYAN,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
          }}
        >
          https://github.com/edgiaxel/CHAINKIN
        </div>

        <span style={{ fontSize: 18, color: "#64748b", marginTop: 8 }}>
          Anchor Program • Next.js 14 • OpenRouter AI • Remotion Demo
        </span>
      </div>

      <SubtitleBar text="This is Chainkin, built for the Solana Hackathon." />
    </div>
  );
};

// Main Storyboard Composition
export const Demo: React.FC = () => {
  return (
    <div style={{ flex: 1, backgroundColor: BG_COLOR, position: "relative" }}>
      {/* 1. Voiceover Audio Track (Primary Timeline) */}
      <Audio src={staticFile("voiceover.mp3")} volume={1.0} />

      {/* 2. Background Music Track (Ducked beneath voiceover) */}
      <Audio
        src={staticFile("bgm.mp3")}
        volume={(f) => {
          if (f < 30) {
            return interpolate(f, [0, 30], [0, 0.12], { extrapolateRight: "clamp" });
          }
          if (f < 2650) {
            return 0.12;
          }
          if (f < 2670) {
            return interpolate(f, [2650, 2670], [0.12, 0.22], { extrapolateRight: "clamp" });
          }
          return interpolate(f, [2670, 2700], [0.22, 0], { extrapolateRight: "clamp" });
        }}
      />

      {/* Scene 1: Hook (0 - 8s, 240 frames) */}
      <Sequence from={0} durationInFrames={240}>
        <Scene1Hook />
      </Sequence>

      {/* Scene 2: Identity & Progression (8 - 20.7s, 380 frames) */}
      <Sequence from={240} durationInFrames={380}>
        <Scene2Identity />
      </Sequence>

      {/* Scene 3: Connect & Awaken (20.7 - 31s, 310 frames) */}
      <Sequence from={620} durationInFrames={310}>
        <Scene3Awaken />
      </Sequence>

      {/* Scene 4: Traits & Rituals (31 - 48.3s, 520 frames) */}
      <Sequence from={930} durationInFrames={520}>
        <Scene4Interactions />
      </Sequence>

      {/* Scene 5: Solana State & OpenRouter AI (48.3 - 69s, 620 frames) */}
      <Sequence from={1450} durationInFrames={620}>
        <Scene5SolanaAI />
      </Sequence>

      {/* Scene 6: Evolution Milestones (69 - 77s, 240 frames) */}
      <Sequence from={2070} durationInFrames={240}>
        <Scene6Evolution />
      </Sequence>

      {/* Scene 7: Printable Stat Card (77 - 85.3s, 250 frames) */}
      <Sequence from={2310} durationInFrames={250}>
        <Scene7StatCard />
      </Sequence>

      {/* Scene 8: Outro & Hackathon (85.3 - 90s, 140 frames) */}
      <Sequence from={2560} durationInFrames={140}>
        <Scene8Outro />
      </Sequence>
    </div>
  );
};
