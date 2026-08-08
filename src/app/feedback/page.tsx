"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui";

export default function FeedbackIndexPage() {
  const router = useRouter();
  const { session } = useStore();

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/feedback/review");
    } else {
      router.replace("/feedback/missions");
    }
  }, [session, router]);

  return (
    <Card>
      <p className="text-sm text-ink-soft">피드백 메뉴로 이동 중…</p>
    </Card>
  );
}
