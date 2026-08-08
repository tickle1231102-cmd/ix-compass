"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DNA_MAP, MISSION_TEMPLATES } from "@/lib/seed";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Tag,
} from "@/components/ui";
import type { DNAId } from "@/lib/types";

export default function HrMissionManagePage() {
  const router = useRouter();
  const { state, session, assignMission, missionTemplates } = useStore();

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/journey/missions");
    }
  }, [session, router]);

  const newhires = useMemo(
    () =>
      state.employees.filter(
        (e) =>
          e.phase === "온보딩 교육" ||
          e.phase === "배치 1개월차" ||
          e.weekNumber <= 4
      ),
    [state.employees]
  );

  const [employeeId, setEmployeeId] = useState(newhires[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(MISSION_TEMPLATES[0]?.id ?? "");
  const template =
    missionTemplates.find((t) => t.id === templateId) ?? MISSION_TEMPLATES[0];

  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [dueAt, setDueAt] = useState("2026-08-15");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!template) return;
    setTitle(template.title);
    setDescription(template.description);
  }, [templateId]);

  if (session && session.role !== "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">내 미션으로 이동 중…</p>
      </Card>
    );
  }

  function handleAssign() {
    if (!template || !employeeId) return;
    if (!title.trim()) return;
    assignMission({
      employeeId,
      templateId: template.id,
      week: template.week,
      title: title.trim(),
      description: description.trim(),
      dnaFocus: [...template.dnaFocus] as DNAId[],
      dueAt: new Date(`${dueAt}T18:00:00.000Z`).toISOString(),
      priority,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  const recent = [...state.missionAssignments]
    .sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Mission Assign</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">미션 배정</h3>
        <p className="mt-1 text-sm text-ink-soft">
          주차별 템플릿을 고른 뒤 개인·팀에 맞춰 수정해 배정하세요. 신입은 결과물을
          제출하고, 인사팀은 AI 요약만 확인합니다.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-faint">대상 입사자</span>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            >
              {state.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.dept} · {e.weekNumber}주차
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-faint">주간 템플릿</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            >
              {missionTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.week}주차 · {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="text-xs font-medium text-ink-faint">미션 제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <label className="mt-3 block text-sm">
          <span className="text-xs font-medium text-ink-faint">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(template?.dnaFocus ?? []).map((id) => (
            <Tag key={id} tone="brand">
              {DNA_MAP.get(id)?.label}
            </Tag>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-faint">마감일</span>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-faint">우선순위</span>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "normal" | "high")
              }
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-brand"
            >
              <option value="normal">보통</option>
              <option value="high">높음</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PrimaryButton onClick={handleAssign}>미션 배정</PrimaryButton>
          <SecondaryButton onClick={() => router.push("/feedback/review")}>
            진행 리뷰 보기
          </SecondaryButton>
          {savedFlash && (
            <span className="text-sm font-medium text-stable">배정 완료</span>
          )}
        </div>
      </Card>

      <Card>
        <h4 className="font-bold text-ink">최근 배정</h4>
        <ul className="mt-3 space-y-2">
          {recent.length === 0 && (
            <li className="text-sm text-ink-soft">배정 이력이 없어요.</li>
          )}
          {recent.map((a) => {
            const emp = state.employees.find((e) => e.id === a.employeeId);
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {emp?.name ?? a.employeeId} · {a.week}주차
                  </p>
                  <p className="text-ink-soft">{a.title}</p>
                </div>
                <Tag tone="neutral">{a.status}</Tag>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
