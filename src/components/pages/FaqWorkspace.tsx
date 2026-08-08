"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FAQS } from "@/lib/seed";
import { Card, Eyebrow, SecondaryButton, Tag } from "@/components/ui";

export default function FaqWorkspace() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (faq) =>
        faq.answer.toLowerCase().includes(q) ||
        faq.keywords.some(
          (kw) =>
            kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase())
        )
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">FAQ · 1:1 문의</h3>
        <p className="mt-1 text-sm text-ink-soft">
          자주 묻는 질문을 검색하고, 필요하면 AI 버디나 조직의 개인 채널로
          이어가세요.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="키워드로 FAQ 검색..."
        className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
      />

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-ink-soft">
            검색 결과가 없어요. AI 버디에게 직접 물어보세요.
          </p>
          <Link href="/resources/ai-buddy" className="mt-4 flex justify-center">
            <SecondaryButton>AI 버디</SecondaryButton>
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((faq) => (
            <li key={faq.id}>
              <Card>
                <div className="flex flex-wrap gap-1.5">
                  {faq.keywords.slice(0, 4).map((kw) => (
                    <Tag key={kw} tone="neutral">
                      {kw}
                    </Tag>
                  ))}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {faq.answer}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/resources/ai-buddy">
          <SecondaryButton>AI 버디에게 묻기</SecondaryButton>
        </Link>
        <Link href="/org/community">
          <SecondaryButton>공지 · 팀 채널 / 1:1</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
