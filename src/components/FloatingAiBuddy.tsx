"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BuddyShortcuts } from "@/components/BuddyShortcuts";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { PrimaryButton, Tag } from "@/components/ui";
import { chunkForStream } from "@/lib/ai";
import { askBuddy } from "@/lib/buddy-api";
import { parseBuddyContent } from "@/lib/buddy-links";
import { getBuddyThread, getBuddyThreads, getChecklistStats } from "@/lib/selectors";
import { useStore } from "@/lib/store";

const FLOATING_THREAD_KEY = "ix-compass-floating-buddy-thread";

function readStoredThreadId(employeeId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FLOATING_THREAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[employeeId] ?? null;
  } catch {
    return null;
  }
}

function storeThreadId(employeeId: string, threadId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(FLOATING_THREAD_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[employeeId] = threadId;
    window.localStorage.setItem(FLOATING_THREAD_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function FloatingAiBuddy({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const {
    state,
    session,
    currentEmployeeId,
    createBuddyThread,
    appendBuddyUserMessage,
    appendBuddyAssistantMessage,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [overrideThreadId, setOverrideThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const onThreadPage =
    /^\/resources\/ai-buddy\/[^/]+$/.test(pathname) ||
    /^\/ai-buddy\/[^/]+$/.test(pathname);
  const hideFab = hidden || onThreadPage;

  const resolvedThreadId = useMemo(() => {
    if (overrideThreadId && getBuddyThread(state, overrideThreadId)) {
      return overrideThreadId;
    }
    const stored = readStoredThreadId(currentEmployeeId);
    if (stored && getBuddyThread(state, stored)?.employeeId === currentEmployeeId) {
      return stored;
    }
    return getBuddyThreads(state, currentEmployeeId)[0]?.id ?? null;
  }, [overrideThreadId, state, currentEmployeeId]);

  const thread = resolvedThreadId
    ? getBuddyThread(state, resolvedThreadId)
    : undefined;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread?.messages.length, streamingText, open]);

  useEffect(() => {
    const timeouts = timeoutIds;
    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  // Clicking the main page (outside the mini chat) collapses it back to the icon
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (root.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function ensureThread(): string {
    if (resolvedThreadId && getBuddyThread(state, resolvedThreadId)) {
      return resolvedThreadId;
    }
    const id = createBuddyThread();
    setOverrideThreadId(id);
    storeThreadId(currentEmployeeId, id);
    return id;
  }

  function startNewChat() {
    const id = createBuddyThread();
    setOverrideThreadId(id);
    storeThreadId(currentEmployeeId, id);
    setInput("");
    setStreamingText(null);
    setIsStreaming(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const id = ensureThread();
    appendBuddyUserMessage(id, text);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    const stats = getChecklistStats(state, currentEmployeeId);
    const checklistSummary = `${stats.checked}/${stats.total} (${stats.percent}%)`;
    const { reply: full } = await askBuddy(text, {
      checklistSummary,
      employeeName: session?.name,
    });
    const { text: visibleReply } = parseBuddyContent(full);

    const chunks = chunkForStream(visibleReply);
    let accumulated = "";
    chunks.forEach((chunk, index) => {
      const timer = setTimeout(() => {
        accumulated += chunk;
        setStreamingText(accumulated);
        if (index === chunks.length - 1) {
          appendBuddyAssistantMessage(id, full);
          setStreamingText(null);
          setIsStreaming(false);
        }
      }, index * 18);
      timeoutIds.current.push(timer);
    });
  }

  if (hideFab) return null;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      {open && (
        <div
          role="dialog"
          aria-label="AI 버디 미니 채팅"
          className="flex h-[min(520px,70vh)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(20,33,61,0.18)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-softer px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                  AI
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">AI 버디</p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {thread?.title ?? "새 대화"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                className="rounded-full px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-white hover:text-ink"
              >
                새 채팅
              </button>
              <Link
                href={
                  resolvedThreadId
                    ? `/resources/ai-buddy/${resolvedThreadId}`
                    : "/resources/ai-buddy"
                }
                className="rounded-full px-2 py-1 text-[11px] font-semibold text-brand-dark hover:bg-white"
                onClick={() => setOpen(false)}
              >
                전체보기
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-xs font-bold text-ink-faint hover:bg-white hover:text-ink"
                aria-label="채팅 닫기"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {(!thread || thread.messages.length === 0) && streamingText === null && (
              <p className="px-2 py-10 text-center text-xs leading-relaxed text-ink-faint">
                이 페이지를 떠나지 않고 바로 질문하세요.
                <br />
                대화는 AI 버디 자유 질문에 자동 저장됩니다.
              </p>
            )}

            {thread?.messages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-xs leading-relaxed text-white">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[88%] space-y-1">
                    <Tag tone="brand">AI Buddy</Tag>
                    <div className="rounded-2xl rounded-tl-sm border border-line bg-white px-3 py-2 text-xs">
                      {(() => {
                        const parsed = parseBuddyContent(msg.content);
                        return (
                          <>
                            <SimpleMarkdown text={parsed.text} />
                            <BuddyShortcuts
                              links={parsed.links}
                              dense
                              onNavigate={() => setOpen(false)}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )
            )}

            {streamingText !== null && (
              <div className="flex justify-start">
                <div className="max-w-[88%] space-y-1">
                  <Tag tone="brand">AI Buddy</Tag>
                  <div className="rounded-2xl rounded-tl-sm border border-line bg-white px-3 py-2 text-xs">
                    <SimpleMarkdown text={streamingText} />
                    <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-line p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 걸 입력하세요..."
              disabled={isStreaming}
              className="flex-1 rounded-full border border-line px-3 py-2 text-xs text-ink outline-none focus:border-brand disabled:opacity-50"
            />
            <PrimaryButton
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="!px-3 !py-2 !text-xs"
            >
              전송
            </PrimaryButton>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "AI 버디 채팅 닫기" : "AI 버디 채팅 열기"}
        className={`group flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          open
            ? "bg-ink text-white"
            : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {open ? (
          <span className="text-lg font-bold leading-none">✕</span>
        ) : (
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-black tracking-tight">AI</span>
            <span className="mt-0.5 text-[9px] font-semibold opacity-90">버디</span>
          </span>
        )}
      </button>
    </div>
  );
}
