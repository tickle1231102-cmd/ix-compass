"use client";

import { InterxBrandPlayer } from "@/components/InterxBrandPlayer";
import { Eyebrow, SectionHeading } from "@/components/ui";

export default function BrandFilmPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow="Brand Motion"
        title="INTERX 30초 브랜드 필름"
        description="Remotion · Canvas · 순수 코드로 렌더링된 1920×1080 / 30fps 모션그래픽. 외부 영상 파일 없이 재생됩니다."
      />

      <InterxBrandPlayer autoPlay loop />

      <div className="mt-8 grid gap-4 sm:grid-cols-5">
        {[
          { t: "0–5s", d: "Unboxing Cube" },
          { t: "5–12s", d: "AX Particle Storm" },
          { t: "12–20s", d: "Core Values" },
          { t: "20–27s", d: "Your Stage" },
          { t: "27–30s", d: "Welcome Lock-in" },
        ].map((s) => (
          <div
            key={s.t}
            className="rounded-xl border border-line bg-white px-4 py-3"
          >
            <Eyebrow>{s.t}</Eyebrow>
            <p className="mt-1 text-sm font-semibold text-ink">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
