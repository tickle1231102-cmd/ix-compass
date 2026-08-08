"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — AI guide now lives inside 미션 수행. */
export default function GuideRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journey/missions#guide");
  }, [router]);
  return (
    <p className="px-4 py-4 text-sm text-ink-soft">미션 수행으로 이동 중…</p>
  );
}
