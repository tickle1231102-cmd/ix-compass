"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BuddyChatPanel } from "@/components/BuddyChatPanel";
import { Card, SecondaryButton } from "@/components/ui";
import { getBuddyThread } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function AiBuddyThreadPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { state, currentEmployeeId } = useStore();
  const thread = getBuddyThread(state, threadId);

  if (!thread || thread.employeeId !== currentEmployeeId) {
    return (
      <Card className="text-center">
        <p className="text-sm text-ink-soft">
          {!thread ? "대화를 찾을 수 없어요." : "이 대화에 접근할 수 없어요."}
        </p>
        <Link href="/resources/ai-buddy" className="mt-4 inline-block">
          <SecondaryButton>자유 질문으로</SecondaryButton>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <Link
          href="/resources/ai-buddy"
          className="text-xs font-semibold text-brand-dark hover:underline"
        >
          ← 자유 질문
        </Link>
        <h2 className="truncate text-lg font-bold text-ink">{thread.title}</h2>
      </div>
      <BuddyChatPanel threadId={threadId} />
    </div>
  );
}
