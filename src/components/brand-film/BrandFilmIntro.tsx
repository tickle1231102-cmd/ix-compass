"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { GiftBeat } from "@/components/brand-film/BrandCanvas";
import {
  playGiftChime,
  playGiftClick,
  playGiftWhoosh,
} from "@/components/brand-film/giftSounds";

const BrandCanvas = dynamic(() => import("@/components/brand-film/BrandCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0B0F19]" />,
});

/**
 * Pre-login gift unboxing film with copy, beats, and SFX.
 */
export function BrandFilmIntro({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  const [beat, setBeat] = useState<GiftBeat>("idle");
  const [outroLine, setOutroLine] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleUnboxStart = useCallback(() => {
    playGiftClick();
  }, []);

  const handleBeat = useCallback((next: GiftBeat) => {
    setBeat(next);
    if (next === "opening") {
      window.setTimeout(() => playGiftWhoosh(), 180);
    }
    if (next === "welcome") {
      playGiftChime();
      setOutroLine(true);
    }
  }, []);

  const handleSceneComplete = useCallback(() => {
    setFading(true);
    window.setTimeout(() => onComplete(), 750);
  }, [onComplete]);

  const showIdleCopy = beat === "idle";
  const showOutroCopy = outroLine && (beat === "welcome" || beat === "done");

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#0B0F19] transition-opacity duration-700 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="INTERX 온보딩 선물"
    >
      <BrandCanvas
        className="absolute inset-0 h-full w-full"
        onUnboxStart={handleUnboxStart}
        onBeat={handleBeat}
        onComplete={handleSceneComplete}
      />

      {/* 1 · 5 — gift packaging & personalization copy */}
      {showIdleCopy && (
        <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#FF5500] sm:text-xs">
            INTERX Onboarding Portal
          </p>
          <p className="mt-4 max-w-md text-base font-semibold text-white/90 sm:text-lg">
            INTERX에 합류하신 것을 환영합니다
          </p>
          <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-white/45 sm:text-sm">
            선물을 열어보세요
          </p>
        </div>
      )}

      {showOutroCopy && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[18%] flex flex-col items-center px-6 text-center">
          <p className="text-sm font-semibold text-white/85 sm:text-base">
            온보딩 여정을 시작하세요
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setFading(true);
          window.setTimeout(() => onComplete(), 400);
        }}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur transition-colors hover:border-[#FF5500]/50 hover:text-white"
      >
        건너뛰기
      </button>
    </div>
  );
}
