"use client";

import { useEffect, useRef, useState } from "react";
import { BuddyShortcuts } from "@/components/BuddyShortcuts";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { Card, PrimaryButton, Tag } from "@/components/ui";
import { chunkForStream } from "@/lib/ai";
import { askBuddy } from "@/lib/buddy-api";
import { parseBuddyContent } from "@/lib/buddy-links";
import { getBuddyThread, getChecklistStats } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export function BuddyChatPanel({
  threadId,
  emptyHint = "온보딩·체크리스트·복지·개발환경 등 무엇이든 물어보세요.",
  minHeightClass = "min-h-[480px]",
  onThreadCreated,
}: {
  /** When null, a thread is created on the first send. */
  threadId: string | null;
  emptyHint?: string;
  minHeightClass?: string;
  onThreadCreated?: (threadId: string) => void;
}) {
  const {
    state,
    session,
    currentEmployeeId,
    createBuddyThread,
    appendBuddyUserMessage,
    appendBuddyAssistantMessage,
  } = useStore();

  const [draftThreadId, setDraftThreadId] = useState<string | null>(null);
  const effectiveId = threadId ?? draftThreadId;
  const thread = effectiveId ? getBuddyThread(state, effectiveId) : undefined;

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread?.messages.length, streamingText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [effectiveId]);

  useEffect(() => {
    const timeouts = timeoutIds;
    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  if (effectiveId && thread && thread.employeeId !== currentEmployeeId) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">이 대화에 접근할 수 없어요.</p>
      </Card>
    );
  }

  if (effectiveId && !thread) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">대화를 찾을 수 없어요.</p>
      </Card>
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;

    let id = effectiveId;
    if (!id) {
      id = createBuddyThread();
      setDraftThreadId(id);
      onThreadCreated?.(id);
    }

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
          appendBuddyAssistantMessage(id!, full);
          setStreamingText(null);
          setIsStreaming(false);
        }
      }, index * 20);
      timeoutIds.current.push(timer);
    });
  }

  const messages = thread?.messages ?? [];

  return (
    <Card className={`flex ${minHeightClass} flex-col p-0`}>
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && streamingText === null && (
          <p className="py-16 text-center text-sm text-ink-faint">{emptyHint}</p>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-white">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[85%] space-y-1.5">
                <Tag tone="brand">AI Buddy</Tag>
                <div className="rounded-xl rounded-tl-sm border border-line bg-white px-4 py-3">
                  {(() => {
                    const parsed = parseBuddyContent(msg.content);
                    return (
                      <>
                        <SimpleMarkdown text={parsed.text} />
                        <BuddyShortcuts links={parsed.links} />
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
            <div className="max-w-[85%] space-y-1.5">
              <Tag tone="brand">AI Buddy</Tag>
              <div className="rounded-xl rounded-tl-sm border border-line bg-white px-4 py-3">
                <SimpleMarkdown text={streamingText} />
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand" />
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
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="궁금한 걸 입력하세요..."
          disabled={isStreaming}
          autoFocus
          className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-50"
        />
        <PrimaryButton type="submit" disabled={!input.trim() || isStreaming}>
          보내기
        </PrimaryButton>
      </form>
    </Card>
  );
}
