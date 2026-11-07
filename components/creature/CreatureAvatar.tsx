"use client";

import React, { FC, useMemo } from "react";
import { SpeciesId, SPECIES_IDS } from "@/lib/creature/types";

export interface CreatureAvatarProps {
  species: SpeciesId;
  evolutionStage?: number;
  evolutionChoice?: number;
  mood?: string;
  className?: string;
  interactive?: boolean;
}

type MoodCategory = "curious" | "energetic" | "affectionate" | "meditative" | "default";

function categorizeMood(mood?: string): MoodCategory {
  if (!mood) return "default";
  const m = mood.toLowerCase();
  if (m.includes("curio") || m.includes("observ") || m.includes("ponder") || m.includes("thought") || m.includes("inquisit")) {
    return "curious";
  }
  if (m.includes("excit") || m.includes("play") || m.includes("energ") || m.includes("bold") || m.includes("fierce") || m.includes("vibrant")) {
    return "energetic";
  }
  if (m.includes("warm") || m.includes("affect") || m.includes("happy") || m.includes("content") || m.includes("comfort") || m.includes("bond")) {
    return "affectionate";
  }
  if (m.includes("calm") || m.includes("meditat") || m.includes("seren") || m.includes("zen") || m.includes("peace") || m.includes("quiet")) {
    return "meditative";
  }
  return "default";
}

export const CreatureAvatar: FC<CreatureAvatarProps> = ({
  species,
  evolutionStage = 0,
  evolutionChoice = 0,
  mood,
  className = "w-48 h-48",
  interactive = false,
}) => {
  const isEvolved = evolutionStage > 0;
  const moodCategory = useMemo(() => categorizeMood(mood), [mood]);

  // Mood aura color mapping
  const moodAura = useMemo(() => {
    switch (moodCategory) {
      case "curious":
        return { stroke: "#38bdf8", fill: "rgba(56,189,248,0.15)", filter: "drop-shadow(0 0 18px rgba(56,189,248,0.7))" };
      case "energetic":
        return { stroke: "#fbbf24", fill: "rgba(251,191,36,0.18)", filter: "drop-shadow(0 0 20px rgba(245,158,11,0.75))" };
      case "affectionate":
        return { stroke: "#f43f5e", fill: "rgba(244,63,94,0.16)", filter: "drop-shadow(0 0 18px rgba(244,63,94,0.7))" };
      case "meditative":
        return { stroke: "#a855f7", fill: "rgba(168,85,247,0.15)", filter: "drop-shadow(0 0 18px rgba(168,85,247,0.65))" };
      default:
        return null;
    }
  }, [moodCategory]);

  // ==========================================
  // SPECIES: WISP (ID: 0)
  // ==========================================
  if (species === SPECIES_IDS.WISP) {
    const isAstralGuide = isEvolved && evolutionChoice === 1;
    const isChronoPhantom = isEvolved && evolutionChoice === 2;

    return (
      <div
        className={`relative flex items-center justify-center select-none ${className} ${
          interactive ? "cursor-pointer hover:scale-105 transition-transform duration-300" : ""
        }`}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_0_28px_rgba(56,189,248,0.65)]"
          aria-label="Wisp Creature"
        >
          <defs>
            <radialGradient id="wispGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="astralGemGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </radialGradient>
            <filter id="wispSoftBlur">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Dynamic Mood Ripple Aura */}
          {moodAura && (
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke={moodAura.stroke}
              strokeWidth="1.5"
              strokeDasharray="6 8"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 100"
                to="360 100 100"
                dur="15s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Ambient spirit rings */}
          <circle
            cx="100"
            cy="100"
            r={isEvolved ? "86" : "74"}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.65"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="22s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Evolved Choice 1: Astral Guide Celestial Orbit */}
          {isAstralGuide && (
            <g opacity="0.8">
              <ellipse
                cx="100"
                cy="100"
                rx="94"
                ry="38"
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                transform="rotate(-25 100 100)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-25 100 100"
                  to="335 100 100"
                  dur="18s"
                  repeatCount="indefinite"
                />
              </ellipse>
              <circle cx="170" cy="80" r="3" fill="#fef08a">
                <animate attributeName="opacity" dur="2s" values="0.3;1;0.3" repeatCount="indefinite" />
              </circle>
              <circle cx="30" cy="120" r="2.5" fill="#bae6fd">
                <animate attributeName="opacity" dur="2.5s" values="0.8;0.2;0.8" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Evolved Choice 2: Chrono Phantom Temporal Dials */}
          {isChronoPhantom && (
            <g opacity="0.75">
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="12 16"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 100 100"
                  to="0 100 100"
                  dur="16s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Slot notch markers */}
              <line x1="100" y1="5" x2="100" y2="14" stroke="#67e8f9" strokeWidth="2" />
              <line x1="100" y1="186" x2="100" y2="195" stroke="#67e8f9" strokeWidth="2" />
              <line x1="5" y1="100" x2="14" y2="100" stroke="#67e8f9" strokeWidth="2" />
              <line x1="186" y1="100" x2="195" y2="100" stroke="#67e8f9" strokeWidth="2" />
            </g>
          )}

          {/* Generic Evolved outer halo */}
          {isEvolved && !isAstralGuide && !isChronoPhantom && (
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1"
              strokeDasharray="8 8"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 100 100"
                to="0 100 100"
                dur="28s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Core Body - Morphing Spirit Flame */}
          <path
            d="M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z"
            fill="url(#wispGlowGrad)"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z;
                M100 30 C140 40 160 80 145 115 C135 150 115 172 100 170 C85 172 65 150 55 115 C40 80 60 40 100 30 Z;
                M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z
              "
            />
          </path>

          {/* Wispy Ethereal Tendrils */}
          <path
            d="M68 140 Q48 165 58 185"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M132 140 Q152 165 142 185"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          {isEvolved && (
            <path
              d="M100 160 Q100 185 100 192"
              stroke="#bae6fd"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          )}

          {/* Expressive Ethereal Eyes */}
          <ellipse cx="88" cy="95" rx="5" ry="7" fill="#ffffff" />
          <ellipse cx="112" cy="95" rx="5" ry="7" fill="#ffffff" />
          <circle cx="89" cy="94" r="2.5" fill="#0284c7" />
          <circle cx="113" cy="94" r="2.5" fill="#0284c7" />
          {/* Eye sparkle highlight */}
          <circle cx="87.5" cy="92.5" r="1" fill="#ffffff" />
          <circle cx="111.5" cy="92.5" r="1" fill="#ffffff" />

          {/* Astral Guide Crown & Third Eye Gem */}
          {isAstralGuide && (
            <g>
              <path
                d="M72 45 L100 18 L128 45 L116 52 L100 34 L84 52 Z"
                fill="#fef08a"
                filter="url(#wispSoftBlur)"
                opacity="0.95"
              />
              <circle cx="100" cy="72" r="5" fill="url(#astralGemGrad)" stroke="#fef08a" strokeWidth="1" />
            </g>
          )}

          {/* Chrono Phantom Dial Ring & Pendulum Crown */}
          {isChronoPhantom && (
            <g>
              <path
                d="M80 48 L100 24 L120 48 L100 38 Z"
                fill="#67e8f9"
                filter="url(#wispSoftBlur)"
                opacity="0.95"
              />
              <circle cx="100" cy="74" r="4.5" fill="#0891b2" stroke="#22d3ee" strokeWidth="1.5" />
            </g>
          )}

          {/* Generic Evolved Crown */}
          {isEvolved && !isAstralGuide && !isChronoPhantom && (
            <path
              d="M75 50 L100 25 L125 50 L115 55 L100 40 L85 55 Z"
              fill="#fef08a"
              filter="url(#wispSoftBlur)"
              opacity="0.9"
            />
          )}
        </svg>
      </div>
    );
  }

  // ==========================================
  // SPECIES: BYTEBEAST (ID: 1)
  // ==========================================
  if (species === SPECIES_IDS.BYTEBEAST) {
    const isCyberWarden = isEvolved && evolutionChoice === 1;
    const isSparkOverdrive = isEvolved && evolutionChoice === 2;

    return (
      <div
        className={`relative flex items-center justify-center select-none ${className} ${
          interactive ? "cursor-pointer hover:scale-105 transition-transform duration-300" : ""
        }`}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_0_28px_rgba(245,158,11,0.55)]"
          aria-label="Bytebeast Creature"
        >
          <defs>
            <linearGradient id="bbMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="bbCoreGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="overdriveCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Cyber Warden Hexagonal Shield Matrix */}
          {isCyberWarden && (
            <g opacity="0.75" stroke="#38bdf8" strokeWidth="1.5" fill="none">
              <polygon points="100,10 175,50 175,150 100,190 25,150 25,50" strokeDasharray="6 4">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 100 100"
                  to="360 100 100"
                  dur="30s"
                  repeatCount="indefinite"
                />
              </polygon>
              {/* Heavy Sentinel Brow Crest */}
              <path d="M42 46 L100 22 L158 46 L148 54 L100 34 L52 54 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            </g>
          )}

          {/* Spark Overdrive Lightning Arcs & Exhaust Coils */}
          {isSparkOverdrive && (
            <g>
              {/* Left lightning discharger */}
              <path
                d="M32 90 L18 80 L28 75 L14 62"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              >
                <animate attributeName="opacity" dur="1s" values="0.2;1;0.4;1;0.2" repeatCount="indefinite" />
              </path>
              {/* Right lightning discharger */}
              <path
                d="M168 90 L182 80 L172 75 L186 62"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              >
                <animate attributeName="opacity" dur="1.2s" values="0.4;1;0.1;1;0.4" repeatCount="indefinite" />
              </path>
            </g>
          )}

          {/* Dynamic Mood Ripple */}
          {moodAura && (
            <rect
              x="36"
              y="32"
              width="128"
              height="136"
              rx="24"
              fill="none"
              stroke={moodAura.stroke}
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity="0.4"
            />
          )}

          {/* Main Antenna */}
          <line x1="100" y1="45" x2="100" y2="24" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="18" r="6.5" fill="#fef08a" className="animate-pulse" />

          {/* Ears / Side Pylons */}
          <polygon points="54,54 68,32 78,54" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
          <polygon points="146,54 132,32 122,54" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />

          {/* Head & Chassis */}
          <rect
            x="52"
            y="48"
            width="96"
            height="92"
            rx="20"
            fill="url(#bbMetalGrad)"
            stroke={isCyberWarden ? "#38bdf8" : "#fbbf24"}
            strokeWidth="2.5"
          />

          {/* Screen Visor */}
          <rect
            x="64"
            y="64"
            width="72"
            height="44"
            rx="12"
            fill="#090d16"
            stroke={isSparkOverdrive ? "#38bdf8" : "#d97706"}
            strokeWidth="1.5"
          />

          {/* LED Eyes with Blink Animation */}
          <rect
            x="74"
            y="78"
            width="16"
            height="12"
            rx="3"
            fill={isSparkOverdrive ? "#38bdf8" : moodCategory === "affectionate" ? "#f43f5e" : "#38bdf8"}
          >
            <animate
              attributeName="height"
              dur="3.2s"
              repeatCount="indefinite"
              values="12;12;2;12;12"
              keyTimes="0;0.85;0.9;0.95;1"
            />
          </rect>
          <rect
            x="110"
            y="78"
            width="16"
            height="12"
            rx="3"
            fill={isSparkOverdrive ? "#38bdf8" : moodCategory === "affectionate" ? "#f43f5e" : "#38bdf8"}
          >
            <animate
              attributeName="height"
              dur="3.2s"
              repeatCount="indefinite"
              values="12;12;2;12;12"
              keyTimes="0;0.85;0.9;0.95;1"
            />
          </rect>

          {/* Chest Core / Gauge */}
          <circle cx="100" cy="122" r="11" fill="url(#bbCoreGlowGrad)" stroke="#78350f" strokeWidth="1.5" />
          <line x1="100" y1="122" x2="105" y2="115" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 122"
              to="360 100 122"
              dur="6s"
              repeatCount="indefinite"
            />
          </line>

          {/* Feet */}
          <rect x="68" y="142" width="22" height="18" rx="7" fill="#92400e" stroke="#78350f" strokeWidth="1" />
          <rect x="110" y="142" width="22" height="18" rx="7" fill="#92400e" stroke="#78350f" strokeWidth="1" />

          {/* Generic Evolved enhancements */}
          {isEvolved && !isCyberWarden && !isSparkOverdrive && (
            <g stroke="#fef08a" strokeWidth="2" fill="none">
              <path d="M40 85 L25 75 L38 95" fill="#f59e0b" />
              <path d="M160 85 L175 75 L162 95" fill="#f59e0b" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // ==========================================
  // SPECIES: MOSSLING (ID: 2 - DEFAULT)
  // ==========================================
  const isElderArbor = isEvolved && evolutionChoice === 1;
  const isBloomWeaver = isEvolved && evolutionChoice === 2;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} ${
        interactive ? "cursor-pointer hover:scale-105 transition-transform duration-300" : ""
      }`}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_28px_rgba(16,185,129,0.55)]"
        aria-label="Mossling Creature"
      >
        <defs>
          <linearGradient id="mossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <radialGradient id="arborGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
        </defs>

        {/* Dynamic Mood Ripple */}
        {moodAura && (
          <circle
            cx="100"
            cy="115"
            r="80"
            fill="none"
            stroke={moodAura.stroke}
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.4"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 115"
              to="360 100 115"
              dur="24s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Elder Arbor: Ancient Heartwood Antlers & Canopy */}
        {isElderArbor && (
          <g stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none">
            {/* Left Branch */}
            <path d="M72 65 Q50 35 32 30 M52 46 Q35 55 24 56" />
            {/* Right Branch */}
            <path d="M128 65 Q150 35 168 30 M148 46 Q165 55 176 56" />
            {/* Golden Amber Sap beads */}
            <circle cx="32" cy="30" r="3.5" fill="url(#arborGlow)" stroke="none" />
            <circle cx="168" cy="30" r="3.5" fill="url(#arborGlow)" stroke="none" />
          </g>
        )}

        {/* Sprout on head (Base or non-Elder) */}
        {!isElderArbor && (
          <g>
            <path d="M100 55 Q95 30 80 32 Q92 45 98 52" fill="#86efac" />
            <path d="M100 55 Q108 25 125 28 Q110 42 102 52" fill="#4ade80" />
          </g>
        )}

        {/* Round Seed Body */}
        <ellipse cx="100" cy="115" rx="62" ry="58" fill="url(#mossGrad)" stroke="#6ee7b7" strokeWidth="2.5" />

        {/* Moss Spots / Texture */}
        <circle cx="75" cy="125" r="7" fill="#047857" opacity="0.65" />
        <circle cx="125" cy="130" r="9" fill="#047857" opacity="0.65" />
        <circle cx="82" cy="142" r="5" fill="#047857" opacity="0.55" />

        {/* Gentle Eyes */}
        <ellipse cx="85" cy="105" rx="5.5" ry="6.5" fill="#0f172a" />
        <ellipse cx="115" cy="105" rx="5.5" ry="6.5" fill="#0f172a" />
        <circle cx="83.5" cy="103" r="2" fill="#ffffff" />
        <circle cx="113.5" cy="103" r="2" fill="#ffffff" />

        {/* Shy Blush */}
        <ellipse cx="73" cy="113" rx="7.5" ry="4.5" fill="#f43f5e" opacity="0.45" />
        <ellipse cx="127" cy="113" rx="7.5" ry="4.5" fill="#f43f5e" opacity="0.45" />

        {/* Smiling mouth */}
        <path d="M96 114 Q100 120 104 114" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Bloom Weaver: Radiant Multi-Petal Blooms */}
        {isBloomWeaver && (
          <g>
            {/* Left Blossom Cluster */}
            <circle cx="56" cy="72" r="9" fill="#f472b6" />
            <circle cx="56" cy="72" r="4" fill="#fef08a" />
            {/* Right Blossom Cluster */}
            <circle cx="144" cy="72" r="9" fill="#f472b6" />
            <circle cx="144" cy="72" r="4" fill="#fef08a" />
            {/* Crown Blossom */}
            <circle cx="100" cy="46" r="7" fill="#fb7185" />
            <circle cx="100" cy="46" r="3" fill="#fef08a" />
            {/* Pollen Sparkle */}
            <circle cx="100" cy="28" r="2" fill="#fef08a">
              <animate attributeName="opacity" dur="1.8s" values="0.3;1;0.3" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Generic Evolved Blooms */}
        {isEvolved && !isElderArbor && !isBloomWeaver && (
          <g>
            <circle cx="60" cy="75" r="8" fill="#f472b6" />
            <circle cx="60" cy="75" r="3" fill="#fef08a" />
            <circle cx="140" cy="75" r="8" fill="#f472b6" />
            <circle cx="140" cy="75" r="3" fill="#fef08a" />
          </g>
        )}
      </svg>
    </div>
  );
};
