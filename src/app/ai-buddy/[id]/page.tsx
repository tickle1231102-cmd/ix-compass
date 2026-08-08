"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export default function LegacyAiBuddyThreadRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    router.replace(id ? `/resources/ai-buddy/${id}` : "/resources/ai-buddy");
  }, [id, router]);

  return (
    <Card>
      <p className="text-sm text-ink-soft">새 자료실 AI 버디로 이동 중…</p>
    </Card>
  );
}
