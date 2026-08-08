"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { computeRiskNote } from "@/lib/ai";
import { askRiskNotes } from "@/lib/ai-api";
import { getMissionRiskSignalsForEmployee } from "@/lib/selectors";
import { Card, Eyebrow, RiskTag, Tag } from "@/components/ui";
import type { RiskLevel } from "@/lib/types";

type Note = {
  level: RiskLevel;
  reason: string;
  suggestedAction: string;
};

export default function RiskRadarPage() {
  const { state, session } = useStore();
  const isHr = session?.role === "hr";

  const baseCards = useMemo(
    () =>
      state.employees.map((emp) => {
        const signals = getMissionRiskSignalsForEmployee(state, emp.id);
        return {
          emp,
          signals,
          note: computeRiskNote(emp.id, 0, signals) as Note,
        };
      }),
    [state]
  );

  const [notesById, setNotesById] = useState<Record<string, Note>>({});

  useEffect(() => {
    let cancelled = false;
    const items = baseCards.map(({ emp, signals }) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      signals,
    }));
    void askRiskNotes(items).then((rows) => {
      if (cancelled) return;
      const next: Record<string, Note> = {};
      for (const row of rows) {
        next[row.employeeId] = row.note;
      }
      setNotesById(next);
    });
    return () => {
      cancelled = true;
    };
  }, [baseCards]);

  if (!isHr) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">
          Isolation Risk Radar는 인사팀 전용 기능입니다.
        </p>
      </Card>
    );
  }

  const riskCards = baseCards.map((card) => ({
    ...card,
    note: notesById[card.emp.id] ?? card.note,
  }));

  const watchCount = riskCards.filter(
    (c) => c.note.level !== "stable"
  ).length;

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Isolation Risk Radar</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">미션 리스크 레이더</h3>
        <p className="mt-1 text-sm text-ink-soft">
          미션 지연·저참여·AI 리스크 신호를 바탕으로 코호트를 한눈에 봅니다.
          신입 프라이빗 노트 원문은 포함되지 않습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tag tone="brand">전체 {riskCards.length}명</Tag>
        <Tag tone={watchCount > 0 ? "watch" : "stable"}>
          관찰·주의 {watchCount}명
        </Tag>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {riskCards.map(({ emp, note, signals }) => (
          <Card key={emp.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{emp.name}</p>
                <p className="text-xs text-ink-faint">
                  {emp.dept} · {emp.phase}
                </p>
              </div>
              <RiskTag level={note.level} />
            </div>
            <p className="mt-3 text-sm text-ink-soft">{note.reason}</p>
            <p className="mt-2 text-xs font-medium text-brand-dark">
              → {note.suggestedAction}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              alert {signals.alertCount} · watch {signals.watchCount} · 지연{" "}
              {signals.overdueLowProgressCount}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
