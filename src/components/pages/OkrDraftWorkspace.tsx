"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { getDraftOkrForEmployee, getEmployeeById } from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Tag,
} from "@/components/ui";

export default function OkrDraftAgentPage() {
  const {
    state,
    session,
    generateOKRDraft,
    approveOKR,
    rejectOKR,
  } = useStore();
  const isHr = session?.role === "hr";
  const [employeeId, setEmployeeId] = useState(
    state.employees[0]?.id ?? ""
  );
  const [month, setMonth] = useState("2026-10");

  const draft = getDraftOkrForEmployee(state, employeeId);
  const employee = getEmployeeById(state, employeeId);

  if (!isHr) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">
          OKR Draft Agent는 인사팀 전용 기능입니다.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>OKR Draft Agent</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">OKR 초안 에이전트</h3>
        <p className="mt-1 text-sm text-ink-soft">
          누적된 핵심가치 근거를 바탕으로 입사자별 다음 달 OKR 초안을
          생성·승인합니다.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-ink-faint">입사자</span>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 block rounded-xl border border-line px-3 py-2 text-sm"
            >
              {state.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.dept}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-faint">대상 월</span>
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="YYYY-MM"
              className="mt-1 block rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <PrimaryButton
            onClick={() => generateOKRDraft(employeeId, month)}
            disabled={!employeeId || !month.trim()}
          >
            초안 생성
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>초안 미리보기</Eyebrow>
          {employee && <Tag tone="brand">{employee.name}</Tag>}
          {draft && (
            <Tag tone="watch">{draft.month} · {draft.status}</Tag>
          )}
        </div>

        {!draft ? (
          <p className="mt-3 text-sm text-ink-soft">
            선택한 입사자의 초안이 없어요. 초안 생성을 눌러 주세요.
          </p>
        ) : (
          <div className="mt-2.5 space-y-2.5">
            {draft.objectives.map((obj, i) => (
              <div
                key={i}
                className="rounded-xl border border-line-soft px-4 py-3"
              >
                <p className="text-sm font-bold text-ink">{obj.title}</p>
                <ul className="mt-2 space-y-1">
                  {obj.keyResults.map((kr, j) => (
                    <li key={j} className="text-sm text-ink-soft">
                      · {kr.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <PrimaryButton onClick={() => approveOKR(draft.id)}>
                승인
              </PrimaryButton>
              <SecondaryButton onClick={() => rejectOKR(draft.id)}>
                반려
              </SecondaryButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
