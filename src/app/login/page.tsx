"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { TEAM_OPTIONS, TEAM_TO_EMPLOYEE_ID, DEMO_EMPLOYEE_ID } from "@/lib/seed";
import type { AuthSession, DeptTeam, UserRole } from "@/lib/types";
import { BrandFilmIntro } from "@/components/brand-film/BrandFilmIntro";
import { PrimaryButton, SecondaryButton, Tag } from "@/components/ui";

type Step = "role" | "team" | "login";

export default function LoginPage() {
  const router = useRouter();
  const { session, hydrated, login } = useStore();

  const [showFilm, setShowFilm] = useState(true);
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [team, setTeam] = useState<DeptTeam | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onFilmComplete = useCallback(() => {
    setShowFilm(false);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (session) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  function enterAs(sessionPayload: AuthSession) {
    login(sessionPayload);
    router.replace("/");
  }

  function selectRole(next: UserRole) {
    setRole(next);
    setTeam(null);
    if (next === "hr") {
      setStep("login");
    } else {
      setStep("team");
    }
  }

  function selectTeam(next: DeptTeam) {
    setTeam(next);
    setStep("login");
  }

  function goBack() {
    if (step === "login") {
      setPassword("");
      if (role === "newhire") setStep("team");
      else {
        setRole(null);
        setStep("role");
      }
      return;
    }
    if (step === "team") {
      setTeam(null);
      setRole(null);
      setStep("role");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !name.trim() || !email.trim() || !password.trim()) return;
    if (role === "newhire" && !team) return;

    enterAs({
      role,
      name: name.trim(),
      email: email.trim(),
      team: role === "newhire" ? team! : undefined,
      employeeId:
        role === "newhire" && team
          ? TEAM_TO_EMPLOYEE_ID[team]
          : DEMO_EMPLOYEE_ID,
      loggedInAt: new Date().toISOString(),
    });
  }

  /** One-click demo entries — temporary for development / live pitch. */
  function enterGuest(as: UserRole) {
    const now = new Date().toISOString();
    if (as === "hr") {
      enterAs({
        role: "hr",
        name: "게스트 HR",
        email: "guest.hr@interxlab.com",
        employeeId: DEMO_EMPLOYEE_ID,
        loggedInAt: now,
        isGuest: true,
      });
      return;
    }
    const guestTeam = team ?? "AX팀";
    const employeeId = TEAM_TO_EMPLOYEE_ID[guestTeam];
    enterAs({
      role: "newhire",
      name: "게스트 입사자",
      email: `guest.${guestTeam.replace("팀", "").toLowerCase()}@interxlab.com`,
      team: guestTeam,
      employeeId,
      loggedInAt: now,
      isGuest: true,
    });
  }

  if (!hydrated || session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-ink-faint">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {showFilm && <BrandFilmIntro onComplete={onFilmComplete} />}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-brand-softer),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_#f7f8fb,_transparent_50%)]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-brand">
            INTERX Onboarding Portal
          </p>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {step === "role" && "해당하는 역할을 선택하세요"}
            {step === "team" && "소속 팀을 선택해 주세요"}
            {step === "login" && "로그인"}
          </h1>
          {step !== "role" && (
            <p className="mt-2 text-sm text-ink-soft">
              {step === "team" &&
                "선택하신 팀에 맞는 온보딩 미션·핵심가치 데이터가 연결됩니다."}
              {step === "login" &&
                "데모용 로그인입니다. 비밀번호는 아무 값이나 입력해도 됩니다."}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <StepDot active={step === "role"} done={step !== "role"} label="1" />
            <div className="h-px flex-1 bg-line" />
            <StepDot
              active={step === "team"}
              done={step === "login" && role === "newhire"}
              label="2"
              muted={role === "hr"}
            />
            <div className="h-px flex-1 bg-line" />
            <StepDot active={step === "login"} done={false} label="3" />
          </div>

          {step === "role" && (
            <div className="grid grid-cols-2 gap-3">
              <RoleCard title="인사팀" onClick={() => selectRole("hr")} />
              <RoleCard
                title="신규입사자"
                onClick={() => selectRole("newhire")}
              />
            </div>
          )}

          {step === "team" && (
            <div className="space-y-3">
              <div className="grid gap-2">
                {TEAM_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectTeam(opt.id)}
                    className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-brand hover:bg-brand-softer"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">{opt.id}</p>
                      <p className="text-xs text-ink-faint">{opt.description}</p>
                    </div>
                    <span className="text-brand">→</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={goBack}
                className="text-xs font-medium text-ink-faint hover:text-ink"
              >
                ← 역할 다시 선택
              </button>
            </div>
          )}

          {step === "login" && role && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <Tag tone="brand">{role === "hr" ? "인사팀" : "신규입사자"}</Tag>
                {team && <Tag tone="neutral">{team}</Tag>}
              </div>

              <Field
                label="이름"
                value={name}
                onChange={setName}
                placeholder={role === "hr" ? "예: 한소율" : "예: 정예빈"}
                autoComplete="name"
              />
              <Field
                label="회사 이메일"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@interxlab.com"
                autoComplete="email"
              />
              <Field
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="데모용 · 아무 값이나 가능"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs font-medium text-ink-faint hover:text-ink"
                >
                  ← 이전
                </button>
                <PrimaryButton
                  type="submit"
                  disabled={!name.trim() || !email.trim() || !password.trim()}
                >
                  로그인
                </PrimaryButton>
              </div>
            </form>
          )}
        </div>

        {step === "login" && (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-line-soft/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Guest Mode · 임시
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {role === "newhire" && team
                    ? `선택한 ${team}으로 게스트 입장합니다.`
                    : "개발·시연용 원클릭 입장. 정식 배포 전 제거 예정입니다."}
                </p>
              </div>
              <Tag tone="watch">DEV</Tag>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {role === "newhire" && team && (
                <SecondaryButton
                  className="flex-1"
                  onClick={() => enterGuest("newhire")}
                >
                  게스트 · 신규입사자 ({team})
                </SecondaryButton>
              )}
              {role === "hr" && (
                <SecondaryButton
                  className="flex-1"
                  onClick={() => enterGuest("hr")}
                >
                  게스트 · 인사팀
                </SecondaryButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
  muted,
}: {
  active: boolean;
  done: boolean;
  label: string;
  muted?: boolean;
}) {
  if (muted) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-line text-[11px] font-bold text-ink-faint opacity-40">
        {label}
      </span>
    );
  }
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
        active
          ? "bg-brand text-white"
          : done
          ? "bg-ink text-white"
          : "border border-line text-ink-faint"
      }`}
    >
      {label}
    </span>
  );
}

function RoleCard({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border border-line px-3 py-5 text-center transition-colors hover:border-brand hover:bg-brand-softer"
    >
      <p className="text-base font-bold text-ink">{title}</p>
      <span className="mt-2 text-xs font-medium text-brand">선택 →</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-faint">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        required
      />
    </label>
  );
}
