"use client";

import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

/** True once past hydration on the client, false during SSR and the first client paint. */
function useHasMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

interface RadarDatum {
  label: string;
  value: number; // 0-100
}

const RINGS = [0.25, 0.5, 0.75, 1];

function pointOnAxis(
  index: number,
  total: number,
  radius: number,
  center: number
) {
  const angle = -90 + (360 / total) * index;
  const rad = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
    angle,
  };
}

export function RadarChart({
  data,
  size = 280,
  brandColor = "#e8562e",
}: {
  data: RadarDatum[];
  size?: number;
  brandColor?: string;
}) {
  const padding = 46;
  const center = size / 2;
  const maxRadius = size / 2 - padding;
  const n = data.length;

  // Render an empty shell on the server and on the first client paint, then
  // fill in the computed geometry after mount. This keeps the pre-hydration
  // markup identical between server and client (SVG coordinates from trig
  // functions can otherwise drift by fractions of a pixel across JS engines
  // and trip React's hydration mismatch check).
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden />
    );
  }

  const valuePoints = data
    .map((d, i) => {
      const r = (Math.max(0, Math.min(100, d.value)) / 100) * maxRadius;
      const p = pointOnAxis(i, n, r, center);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="12개 핵심가치 항목별 행동 근거 점수 레이더 차트"
    >
      {RINGS.map((ring) => {
        const points = Array.from({ length: n }, (_, i) => {
          const p = pointOnAxis(i, n, maxRadius * ring, center);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            stroke="#e7e9ef"
            strokeWidth={1}
          />
        );
      })}

      {data.map((_, i) => {
        const p = pointOnAxis(i, n, maxRadius, center);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#e7e9ef"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={valuePoints}
        fill={brandColor}
        fillOpacity={0.14}
        stroke={brandColor}
        strokeWidth={2}
      />

      {data.map((d, i) => {
        const r = (Math.max(0, Math.min(100, d.value)) / 100) * maxRadius;
        const p = pointOnAxis(i, n, r, center);
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={brandColor} />;
      })}

      {data.map((d, i) => {
        const p = pointOnAxis(i, n, maxRadius + 16, center);
        const angle = ((p.angle % 360) + 360) % 360;
        let anchor: "start" | "middle" | "end" = "middle";
        if (angle > 10 && angle < 170) anchor = "start";
        else if (angle > 190 && angle < 350) anchor = "end";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            fontSize={10.5}
            fontWeight={600}
            fill="#4a5578"
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
