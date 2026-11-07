"use client";

import React, { FC } from "react";
import { SpeciesId, SPECIES_IDS } from "@/lib/creature/types";

interface CreatureAvatarProps {
  species: SpeciesId;
  evolutionStage?: number;
  evolutionChoice?: number;
  className?: string;
}

export const CreatureAvatar: FC<CreatureAvatarProps> = ({
  species,
  evolutionStage = 0,
  evolutionChoice = 0,
  className = "w-48 h-48",
}) => {
  const isEvolved = evolutionStage > 0;

  // Species: Wisp
  if (species === SPECIES_IDS.WISP) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]">
          <defs>
            <radialGradient id="wispGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="80%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>
            <filter id="blurFilter">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Ambient spirit rings */}
          <circle cx="100" cy="100" r={isEvolved ? "88" : "75"} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite" />
          </circle>

          {isEvolved && (
            <circle cx="100" cy="100" r="95" fill="none" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="8 8" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="30s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Core Body */}
          <path
            d="M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z"
            fill="url(#wispGlow)"
          >
            <animate attributeName="d" dur="4s" repeatCount="indefinite" values="
              M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z;
              M100 30 C140 40 160 80 145 115 C135 150 115 172 100 170 C85 172 65 150 55 115 C40 80 60 40 100 30 Z;
              M100 35 C135 35 155 70 150 110 C145 145 125 170 100 175 C75 170 55 145 50 110 C45 70 65 35 100 35 Z
            " />
          </path>

          {/* Wispy Ethereal Tendrils */}
          <path d="M70 140 Q50 165 60 185" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M130 140 Q150 165 140 185" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* Eyes */}
          <ellipse cx="88" cy="95" rx="5" ry="7" fill="#ffffff" />
          <ellipse cx="112" cy="95" rx="5" ry="7" fill="#ffffff" />
          <circle cx="89" cy="94" r="2.5" fill="#0284c7" />
          <circle cx="113" cy="94" r="2.5" fill="#0284c7" />

          {/* Crown/Halo if evolved */}
          {isEvolved && (
            <path
              d="M75 50 L100 25 L125 50 L115 55 L100 40 L85 55 Z"
              fill="#fef08a"
              filter="url(#blurFilter)"
              opacity="0.9"
            />
          )}
        </svg>
      </div>
    );
  }

  // Species: Bytebeast
  if (species === SPECIES_IDS.BYTEBEAST) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
          <defs>
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="coreGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Antenna */}
          <line x1="100" y1="45" x2="100" y2="25" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="20" r="6" fill="#fef08a" className="animate-pulse" />

          {/* Ears / Antennas */}
          <polygon points="55,55 70,35 78,55" fill="#d97706" />
          <polygon points="145,55 130,35 122,55" fill="#d97706" />

          {/* Head & Chassis */}
          <rect x="52" y="50" width="96" height="90" rx="18" fill="url(#metalGrad)" stroke="#fbbf24" strokeWidth="2.5" />

          {/* Screen Visor */}
          <rect x="64" y="65" width="72" height="42" rx="10" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />

          {/* LED Eyes */}
          <rect x="74" y="78" width="16" height="12" rx="3" fill="#38bdf8">
            <animate attributeName="height" dur="3s" repeatCount="indefinite" values="12;2;12" keyTimes="0;0.1;0.2" />
          </rect>
          <rect x="110" y="78" width="16" height="12" rx="3" fill="#38bdf8">
            <animate attributeName="height" dur="3s" repeatCount="indefinite" values="12;2;12" keyTimes="0;0.1;0.2" />
          </rect>

          {/* Chest Core / Gauge */}
          <circle cx="100" cy="120" r="10" fill="url(#coreGlow)" />
          <line x1="100" y1="120" x2="104" y2="114" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />

          {/* Feet */}
          <rect x="68" y="142" width="22" height="16" rx="6" fill="#92400e" />
          <rect x="110" y="142" width="22" height="16" rx="6" fill="#92400e" />

          {/* Evolved enhancements: Golden Overclock Spikes */}
          {isEvolved && (
            <g stroke="#fef08a" strokeWidth="2" fill="none">
              <path d="M40 85 L25 75 L38 95" fill="#f59e0b" />
              <path d="M160 85 L175 75 L162 95" fill="#f59e0b" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // Species: Mossling (Default)
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
        <defs>
          <linearGradient id="mossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>

        {/* Sprout on head */}
        <path d="M100 55 Q95 30 80 32 Q92 45 98 52" fill="#86efac" />
        <path d="M100 55 Q108 25 125 28 Q110 42 102 52" fill="#4ade80" />

        {/* Round Seed Body */}
        <ellipse cx="100" cy="115" rx="62" ry="58" fill="url(#mossGrad)" stroke="#6ee7b7" strokeWidth="2" />

        {/* Moss Spots */}
        <circle cx="75" cy="125" r="7" fill="#047857" opacity="0.6" />
        <circle cx="125" cy="130" r="9" fill="#047857" opacity="0.6" />
        <circle cx="82" cy="142" r="5" fill="#047857" opacity="0.5" />

        {/* Gentle Eyes */}
        <ellipse cx="85" cy="105" rx="5" ry="6" fill="#0f172a" />
        <ellipse cx="115" cy="105" rx="5" ry="6" fill="#0f172a" />
        <circle cx="84" cy="103" r="2" fill="#ffffff" />
        <circle cx="114" cy="103" r="2" fill="#ffffff" />

        {/* Shy Blush */}
        <ellipse cx="73" cy="113" rx="7" ry="4" fill="#f43f5e" opacity="0.4" />
        <ellipse cx="127" cy="113" rx="7" ry="4" fill="#f43f5e" opacity="0.4" />

        {/* Little smiling mouth */}
        <path d="M96 114 Q100 119 104 114" fill="none" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" />

        {/* Evolved Blooms */}
        {isEvolved && (
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
