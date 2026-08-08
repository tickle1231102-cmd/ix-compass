"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  getEmployeeById,
  getOrgMember,
  getOrgMembersByTeam,
} from "@/lib/selectors";
import { Card, Eyebrow, SecondaryButton, Tag } from "@/components/ui";
import { SEED_ORG_MEMBERS } from "@/lib/seed";

export default function OrgChartWorkspace({
  mode = "chart",
}: {
  mode?: "chart" | "buddy" | "people";
}) {
  const { state, currentEmployeeId } = useStore();
  const me = getEmployeeById(state, currentEmployeeId);
  const teams = getOrgMembersByTeam();
  const [query, setQuery] = useState("");

  const buddy = me?.buddyId ? getOrgMember(me.buddyId) : undefined;
  const mentor = me?.mentorId ? getOrgMember(me.mentorId) : undefined;

  const teamOrder = ["AX팀", "PM팀", "전략팀", "마케팅팀", "HR팀"];
  const sortedTeams = Object.keys(teams).sort((a, b) => {
    const ai = teamOrder.indexOf(a);
    const bi = teamOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEED_ORG_MEMBERS;
    return SEED_ORG_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        String(m.team).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q)
    );
  }, [query]);

  if (mode === "buddy") {
    return (
      <div className="space-y-6">
        <div>
          <Eyebrow>Mentor & Buddy</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">나의 멘토 / 버디</h3>
          <p className="mt-1 text-sm text-ink-soft">
            온보딩 중 가장 먼저 연락할 지원망입니다.
          </p>
        </div>
        {!buddy && !mentor ? (
          <Card>
            <p className="text-sm text-ink-soft">
              아직 배정된 버디·멘토가 없어요. 인사팀에 문의해 주세요.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {buddy && (
              <Card className="border-brand/40 bg-brand-softer/40">
                <Tag tone="brand">내 버디</Tag>
                <p className="mt-2 text-lg font-bold text-ink">{buddy.name}</p>
                <p className="text-sm text-ink-soft">
                  {buddy.role} · {buddy.team}
                </p>
                <a
                  href={`mailto:${buddy.email}`}
                  className="mt-2 inline-block text-sm font-semibold text-brand-dark"
                >
                  {buddy.email}
                </a>
                <p className="mt-2 text-sm text-ink-soft">{buddy.bio}</p>
              </Card>
            )}
            {mentor && (
              <Card className="border-brand/40 bg-brand-softer/40">
                <Tag tone="brand">내 멘토</Tag>
                <p className="mt-2 text-lg font-bold text-ink">{mentor.name}</p>
                <p className="text-sm text-ink-soft">
                  {mentor.role} · {mentor.team}
                </p>
                <a
                  href={`mailto:${mentor.email}`}
                  className="mt-2 inline-block text-sm font-semibold text-brand-dark"
                >
                  {mentor.email}
                </a>
                <p className="mt-2 text-sm text-ink-soft">{mentor.bio}</p>
              </Card>
            )}
          </div>
        )}
        <Link href="/org">
          <SecondaryButton>조직도 전체 보기</SecondaryButton>
        </Link>
      </div>
    );
  }

  if (mode === "people") {
    return (
      <div className="space-y-6">
        <div>
          <Eyebrow>People Search</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">동료 프로필 검색</h3>
          <p className="mt-1 text-sm text-ink-soft">
            이름·팀·역할·키워드로 협업 담당자를 찾아보세요.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 팀, 역할, 키워드…"
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
        <ul className="space-y-2">
          {people.map((member) => (
            <li key={member.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{member.name}</span>
                  <Tag tone="neutral">{member.team}</Tag>
                  <Tag tone="brand">{member.role}</Tag>
                </div>
                <a
                  href={`mailto:${member.email}`}
                  className="mt-1 inline-block text-xs font-medium text-brand-dark"
                >
                  {member.email}
                </a>
                <p className="mt-1 text-sm text-ink-soft">{member.bio}</p>
              </Card>
            </li>
          ))}
          {people.length === 0 && (
            <Card>
              <p className="text-sm text-ink-soft">검색 결과가 없어요.</p>
            </Card>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Org Chart</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">조직도 & 팀별 소개</h3>
        <p className="mt-1 text-sm text-ink-soft">
          팀별 구성원과 연락처를 확인하세요.
        </p>
      </div>

      {(buddy || mentor) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {buddy && (
            <Card className="border-brand/40 bg-brand-softer/40">
              <Tag tone="brand">내 버디</Tag>
              <p className="mt-2 font-bold text-ink">{buddy.name}</p>
              <p className="text-sm text-ink-soft">
                {buddy.role} · {buddy.team}
              </p>
            </Card>
          )}
          {mentor && (
            <Card className="border-brand/40 bg-brand-softer/40">
              <Tag tone="brand">내 멘토</Tag>
              <p className="mt-2 font-bold text-ink">{mentor.name}</p>
              <p className="text-sm text-ink-soft">
                {mentor.role} · {mentor.team}
              </p>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {sortedTeams.map((team) => {
          const members = teams[team] ?? [];
          return (
            <Card key={team}>
              <Eyebrow>{team}</Eyebrow>
              <h3 className="mt-1 text-lg font-bold text-ink">
                {team}{" "}
                <span className="text-sm font-normal text-ink-faint">
                  ({members.length}명)
                </span>
              </h3>
              <ul className="mt-3 divide-y divide-line-soft">
                {members.map((member) => {
                  const isBuddy = member.id === me?.buddyId;
                  const isMentor = member.id === me?.mentorId;
                  return (
                    <li
                      key={member.id}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">
                          {member.name}
                        </span>
                        <Tag tone="neutral">{member.role}</Tag>
                        {isBuddy && <Tag tone="brand">버디</Tag>}
                        {isMentor && <Tag tone="brand">멘토</Tag>}
                      </div>
                      <a
                        href={`mailto:${member.email}`}
                        className="text-xs font-medium text-brand-dark hover:underline"
                      >
                        {member.email}
                      </a>
                      <p className="text-sm text-ink-soft">{member.bio}</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/org/buddy">
          <SecondaryButton>멘토 / 버디</SecondaryButton>
        </Link>
        <Link href="/org/people">
          <SecondaryButton>동료 검색</SecondaryButton>
        </Link>
        <Link href="/resources/faq">
          <SecondaryButton>FAQ</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
