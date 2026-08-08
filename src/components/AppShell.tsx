"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FloatingAiBuddy } from "@/components/FloatingAiBuddy";
import {
  hasSeenNewhireGuide,
  NewhirePortalGuide,
  type GuideStepHref,
} from "@/components/NewhirePortalGuide";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, hydrated, currentEmployeeId } = useStore();
  const isLogin = pathname === "/login";
  const [guideHref, setGuideHref] = useState<GuideStepHref | null>(null);
  const [guideEpoch, setGuideEpoch] = useState(0);

  const onStepHrefChange = useCallback((href: GuideStepHref | null) => {
    setGuideHref(href);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session && !isLogin) {
      router.replace("/login");
      return;
    }
    if (session && isLogin) {
      router.replace("/");
    }
  }, [hydrated, session, isLogin, router]);

  void guideEpoch;
  const showGuide =
    hydrated &&
    !!session &&
    session.role === "newhire" &&
    !hasSeenNewhireGuide(currentEmployeeId);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-ink-faint">불러오는 중…</p>
      </div>
    );
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-ink-faint">로그인 페이지로 이동 중…</p>
      </div>
    );
  }

  return (
    <>
      <NavBar guideHighlightHref={showGuide ? guideHref : null} />
      <main className={`flex-1 ${showGuide ? "pb-44" : ""}`}>{children}</main>
      <Footer />
      <FloatingAiBuddy hidden={showGuide} />
      {showGuide && (
        <NewhirePortalGuide
          employeeId={currentEmployeeId}
          onComplete={() => setGuideEpoch((n) => n + 1)}
          onStepHrefChange={onStepHrefChange}
        />
      )}
    </>
  );
}
