"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  Eyebrow,
  SecondaryButton,
  SectionHeading,
  Tag,
} from "@/components/ui";
import { LIBRARY_CATEGORIES, searchLibraryDocs } from "@/lib/selectors";
import type { LibraryCategory } from "@/lib/types";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const docs = useMemo(() => searchLibraryDocs(query), [query]);

  const grouped = useMemo(() => {
    const map = new Map<LibraryCategory, typeof docs>();
    for (const cat of LIBRARY_CATEGORIES) {
      map.set(cat, []);
    }
    for (const doc of docs) {
      const list = map.get(doc.category) ?? [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return map;
  }, [docs]);

  return (
    <div className="space-y-3">

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 키워드, 카테고리로 검색..."
          className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/org">
            <SecondaryButton>조직 & 담당자</SecondaryButton>
          </Link>
          <Link href="/resources/faq">
            <SecondaryButton>FAQ</SecondaryButton>
          </Link>
        </div>
      </div>

      {docs.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-ink-soft">
            &ldquo;{query}&rdquo;에 맞는 문서가 없어요. 다른 키워드로
            검색해보세요.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {LIBRARY_CATEGORIES.map((category) => {
            const items = grouped.get(category) ?? [];
            if (items.length === 0) return null;
            return (
              <Card key={category}>
                <Eyebrow>{category}</Eyebrow>
                <h3 className="mt-1 text-lg font-bold text-ink">{category}</h3>
                <ul className="mt-3 space-y-2">
                  {items.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-line-soft px-3 py-2.5 transition-colors hover:border-brand"
                      >
                        <p className="text-sm font-semibold text-ink">
                          {doc.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {doc.summary}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.keywords.slice(0, 4).map((kw) => (
                            <Tag key={kw} tone="neutral">
                              {kw}
                            </Tag>
                          ))}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-ink-faint">
        {docs.length}개 문서 · AI 버디 대화에서도 관련 자료를 추천해드려요.
      </p>
    </div>
  );
}
