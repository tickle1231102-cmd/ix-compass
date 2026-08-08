"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MissionsWorkspace from "@/components/pages/MissionsWorkspace";
import { Card } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Page() {
  const router = useRouter();
  const { session } = useStore();

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/feedback/review");
    }
  }, [session, router]);

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">진행 리뷰로 이동 중…</p>
      </Card>
    );
  }

  return <MissionsWorkspace />;
}
