"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuddyChatPanel } from "@/components/BuddyChatPanel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast } from "@/components/Toast";
import { Eyebrow, Tag } from "@/components/ui";
import { getBuddyThreads } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { BuddyThread } from "@/lib/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AiBuddyPage() {
  const { state, currentEmployeeId, deleteBuddyThread, restoreBuddyThread } =
    useStore();

  const threads = getBuddyThreads(state, currentEmployeeId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [freshChat, setFreshChat] = useState(false);
  const [chatNonce, setChatNonce] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoThread, setUndoThread] = useState<BuddyThread | null>(null);

  const currentId = useMemo(() => {
    if (freshChat) return null;
    if (activeId && threads.some((t) => t.id === activeId)) return activeId;
    return threads[0]?.id ?? null;
  }, [activeId, threads, freshChat]);

  function handleNewChat() {
    setFreshChat(true);
    setActiveId(null);
    setChatNonce((n) => n + 1);
  }

  function handleSelectThread(id: string) {
    setFreshChat(false);
    setActiveId(id);
    setChatNonce((n) => n + 1);
  }

  function handleThreadCreated(id: string) {
    setFreshChat(false);
    setActiveId(id);
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const thread = threads.find((t) => t.id === pendingDeleteId) ?? null;
    deleteBuddyThread(pendingDeleteId);
    if (activeId === pendingDeleteId) {
      setActiveId(null);
    }
    setPendingDeleteId(null);
    if (thread) setUndoThread(thread);
  }

  const pastThreads = currentId
    ? threads.filter((t) => t.id !== currentId)
    : threads;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>자유 질문</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">자유 질문</h3>
          <p className="mt-1 text-sm text-ink-soft">
            온보딩·복지·개발환경·핵심가치 등 궁금한 점을 바로 물어보세요.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex min-h-9 items-center text-sm font-semibold text-brand-dark hover:underline"
        >
          + 새 대화
        </button>
      </div>

      <BuddyChatPanel
        key={chatNonce}
        threadId={currentId}
        emptyHint="아래에 질문을 입력하면 바로 대화가 시작됩니다."
        onThreadCreated={handleThreadCreated}
      />

      {pastThreads.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-faint">이전 대화</p>
          <ul className="space-y-1.5">
            {pastThreads.map((thread) => {
              const preview =
                thread.messages[thread.messages.length - 1]?.content ??
                "메시지 없음";
              return (
                <li key={thread.id}>
                  <div className="group flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectThread(thread.id)}
                      className="min-h-9 min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {thread.title}
                        </span>
                        <Tag tone="neutral">{thread.messages.length}</Tag>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-soft">
                        {preview}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {formatDate(thread.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(thread.id)}
                      className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-line px-3 py-1 text-[11px] font-medium text-ink-faint transition-colors hover:border-alert hover:text-alert sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-xs leading-relaxed text-ink-faint">
        Tip · 연차·복지·개발환경·핵심가치 키워드면 더 구체적으로 답해요.{" "}
        <Link href="/journey/missions" className="font-semibold text-brand-dark">
          내 미션
        </Link>
        {" · "}
        <Link href="/feedback/anonymous" className="font-semibold text-brand-dark">
          익명 피드백
        </Link>
      </p>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="대화 삭제"
        body="이 대화를 삭제할까요? 삭제 직후 5초간 되돌릴 수 있어요."
        confirmLabel="삭제"
        tone="danger"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <Toast
        open={undoThread !== null}
        message="대화를 삭제했어요."
        actionLabel="되돌리기"
        onClose={() => setUndoThread(null)}
        onAction={() => {
          if (undoThread) restoreBuddyThread(undoThread);
        }}
      />
    </div>
  );
}
