"use client";

import { useMemo, useState } from "react";
import { Card, Eyebrow } from "@/components/ui";
import { GLOSSARY } from "@/lib/glossary";

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Glossary</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">용어 사전</h3>
        <p className="mt-1 text-sm text-ink-soft">
          사내 용어·약어·온보딩 프로세스를 검색해 보세요.
        </p>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="용어, 동의어, 설명 검색…"
        className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
      />
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.term}>
            <Card>
              <p className="font-bold text-ink">{e.term}</p>
              {e.aliases && e.aliases.length > 0 && (
                <p className="mt-1 text-xs text-ink-faint">
                  동의어: {e.aliases.join(", ")}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {e.definition}
              </p>
            </Card>
          </li>
        ))}
        {entries.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">검색 결과가 없어요.</p>
          </Card>
        )}
      </ul>
    </div>
  );
}
