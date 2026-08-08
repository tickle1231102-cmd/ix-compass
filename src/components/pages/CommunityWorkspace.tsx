"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { TEAM_OPTIONS } from "@/lib/seed";
import {
  getAllPersonalThreadsForHr,
  getBoardPosts,
  getEmployeeById,
  getPersonalPosts,
  getTeamPosts,
} from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  Tag,
} from "@/components/ui";
import type { BoardCategory, CommunityPost, DeptTeam } from "@/lib/types";
import { BOARD_CATEGORY_LABEL } from "@/lib/types";

type CommunityTab = "board" | "team" | "personal";

const TABS: { id: CommunityTab; label: string }[] = [
  { id: "board", label: "공지" },
  { id: "team", label: "팀 채널" },
  { id: "personal", label: "개인 채널" },
];

function formatPostTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PostCard({ post }: { post: CommunityPost }) {
  const isHrAuthor = post.authorId === "hr";
  return (
    <article className="rounded-xl border border-line-soft px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-ink">
          {post.anonymous ? "익명" : post.authorName}
        </span>
        {isHrAuthor && !post.anonymous && (
          <Tag tone="brand">인사팀</Tag>
        )}
        {post.channel === "board" && (
          <Tag tone="brand">
            {BOARD_CATEGORY_LABEL[post.boardCategory ?? "notice"]}
          </Tag>
        )}
        {post.team && <Tag tone="neutral">{post.team}</Tag>}
        <span className="ml-auto text-xs text-ink-faint">
          {formatPostTime(post.createdAt)}
        </span>
      </div>
      {post.title && (
        <h4 className="mt-2 text-base font-bold text-ink">{post.title}</h4>
      )}
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
        {post.body}
      </p>
    </article>
  );
}

function CommunityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, session, currentEmployeeId, addCommunityPost } = useStore();

  const tabParam = searchParams.get("tab");
  const catParam = searchParams.get("cat");
  const [localTab, setLocalTab] = useState<CommunityTab>("board");
  const tab: CommunityTab =
    tabParam === "board" || tabParam === "team" || tabParam === "personal"
      ? tabParam
      : localTab;
  const activeBoardCategory: BoardCategory =
    catParam === "notice" ? catParam : "notice";

  function selectTab(id: CommunityTab) {
    setLocalTab(id);
    if (id === "board") {
      router.replace(`/org/community?tab=board&cat=${activeBoardCategory}`, {
        scroll: false,
      });
    } else {
      router.replace(`/org/community?tab=${id}`, { scroll: false });
    }
  }

  const isHr = session?.role === "hr";

  const [boardTitle, setBoardTitle] = useState("");
  const [boardBody, setBoardBody] = useState("");

  /** New hire: always their login team. HR: browsable. */
  const myTeam: DeptTeam | null = useMemo(() => {
    if (session?.team) return session.team;
    if (session?.role === "newhire") {
      const emp = getEmployeeById(state, currentEmployeeId);
      const dept = emp?.dept;
      if (dept && TEAM_OPTIONS.some((o) => o.id === dept)) {
        return dept as DeptTeam;
      }
    }
    return null;
  }, [session, state, currentEmployeeId]);

  const [hrBrowseTeam, setHrBrowseTeam] = useState<DeptTeam>(TEAM_OPTIONS[0].id);
  const activeTeam: DeptTeam | null = isHr ? hrBrowseTeam : myTeam;

  const [teamBody, setTeamBody] = useState("");
  const [teamTitle, setTeamTitle] = useState("");

  const [personalBody, setPersonalBody] = useState("");
  const [personalAnonymous, setPersonalAnonymous] = useState(false);

  const [hrSelectedPeer, setHrSelectedPeer] = useState<string | null>(null);
  const [hrReplyBody, setHrReplyBody] = useState("");

  const boardPosts = useMemo(
    () => getBoardPosts(state, activeBoardCategory),
    [state, activeBoardCategory]
  );
  const teamPosts = useMemo(
    () => (activeTeam ? getTeamPosts(state, activeTeam) : []),
    [state, activeTeam]
  );

  const hrThreads = useMemo(
    () => getAllPersonalThreadsForHr(state),
    [state]
  );

  const effectiveHrPeer =
    hrSelectedPeer ?? hrThreads[0]?.peerEmployeeId ?? null;

  const personalPosts = useMemo(() => {
    const peerId = isHr ? effectiveHrPeer : currentEmployeeId;
    if (!peerId) return [];
    return getPersonalPosts(state, peerId);
  }, [state, isHr, effectiveHrPeer, currentEmployeeId]);

  function submitBoard() {
    const title = boardTitle.trim();
    const body = boardBody.trim();
    if (!title || !body) return;
    addCommunityPost({
      channel: "board",
      title,
      body,
      anonymous: false,
      boardCategory: activeBoardCategory,
    });
    setBoardTitle("");
    setBoardBody("");
  }

  function submitTeam() {
    const body = teamBody.trim();
    if (!body || !activeTeam) return;
    addCommunityPost({
      channel: "team",
      title: teamTitle.trim() || undefined,
      body,
      anonymous: false,
      team: activeTeam,
    });
    setTeamBody("");
    setTeamTitle("");
  }

  function submitPersonal() {
    const body = personalBody.trim();
    if (!body) return;
    addCommunityPost({
      channel: "personal",
      body,
      anonymous: personalAnonymous,
      peerEmployeeId: currentEmployeeId,
    });
    setPersonalBody("");
    setPersonalAnonymous(false);
  }

  function submitHrReply() {
    const body = hrReplyBody.trim();
    if (!body || !effectiveHrPeer) return;
    addCommunityPost({
      channel: "personal",
      body,
      anonymous: false,
      peerEmployeeId: effectiveHrPeer,
    });
    setHrReplyBody("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Community</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">공지 · 팀 채널</h3>
        <p className="mt-1 text-sm text-ink-soft">
          전사 공지, 팀 채널, HR 1:1 개인 채널로 소통하세요.
        </p>
      </div>

      {/* 커뮤니티 세부 탭 — 가로 옵션 선택 (조직 좌측바와 분리) */}
      <div
        role="tablist"
        aria-label="커뮤니티 채널"
        className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-line-soft/60 p-1"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          const label =
            t.id === "team" && myTeam && !isHr
              ? `${t.label} · ${myTeam}`
              : t.label;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === "board" && (
        <div className="space-y-6">
          <Card>
            <Eyebrow>새 글 작성</Eyebrow>
            <h3 className="mt-1 text-lg font-bold text-ink">
              {BOARD_CATEGORY_LABEL[activeBoardCategory]}
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              {activeBoardCategory === "notice"
                ? "전사 공지·안내를 남겨 주세요."
                : null}
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
              />
              <textarea
                value={boardBody}
                onChange={(e) => setBoardBody(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={4}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
              />
              <PrimaryButton
                onClick={submitBoard}
                disabled={!boardTitle.trim() || !boardBody.trim()}
              >
                게시하기
              </PrimaryButton>
            </div>
          </Card>

          <div className="space-y-3">
            {boardPosts.length === 0 ? (
              <Card>
                <p className="text-sm text-ink-soft">
                  {BOARD_CATEGORY_LABEL[activeBoardCategory]}에 아직 글이
                  없어요.
                </p>
              </Card>
            ) : (
              boardPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-6">
          {!activeTeam ? (
            <Card>
              <p className="text-sm text-ink-soft">
                소속 팀 정보가 없어요. 다시 로그인해 팀을 선택해 주세요.
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Eyebrow>
                      {isHr ? "팀 채널 (전체 열람)" : "내 소속 팀 채널"}
                    </Eyebrow>
                    <h3 className="mt-1 text-lg font-bold text-ink">
                      {activeTeam} 소식
                    </h3>
                    {!isHr && (
                      <p className="mt-1 text-xs text-ink-soft">
                        로그인 시 선택한 소속 팀 채널만 볼 수 있어요.
                      </p>
                    )}
                  </div>
                  {isHr ? (
                    <select
                      value={activeTeam}
                      onChange={(e) =>
                        setHrBrowseTeam(e.target.value as DeptTeam)
                      }
                      className="rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    >
                      {TEAM_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Tag tone="brand">내 팀 · {activeTeam}</Tag>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <input
                    value={teamTitle}
                    onChange={(e) => setTeamTitle(e.target.value)}
                    placeholder="제목 (선택)"
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  <textarea
                    value={teamBody}
                    onChange={(e) => setTeamBody(e.target.value)}
                    placeholder={`${activeTeam} 팀원들에게 남길 메시지`}
                    rows={3}
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  <PrimaryButton
                    onClick={submitTeam}
                    disabled={!teamBody.trim()}
                  >
                    팀에 게시
                  </PrimaryButton>
                </div>
              </Card>

              <div className="space-y-3">
                {teamPosts.length === 0 ? (
                  <Card>
                    <p className="text-sm text-ink-soft">
                      {activeTeam} 채널에 아직 글이 없어요.
                    </p>
                  </Card>
                ) : (
                  teamPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "personal" && (
        <div className="space-y-6">
          {isHr ? (
            <div className="grid gap-4 lg:grid-cols-[128px_1fr]">
              <Card className="h-fit !p-2.5">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  입사자
                </p>
                {hrThreads.length === 0 ? (
                  <p className="mt-2 px-1 text-xs text-ink-soft">문의 없음</p>
                ) : (
                  <ul className="mt-2 space-y-0.5">
                    {hrThreads.map(({ peerEmployeeId }) => {
                      const employee = getEmployeeById(state, peerEmployeeId);
                      const active = effectiveHrPeer === peerEmployeeId;
                      return (
                        <li key={peerEmployeeId}>
                          <button
                            type="button"
                            onClick={() => setHrSelectedPeer(peerEmployeeId)}
                            title={employee?.name ?? peerEmployeeId}
                            className={`w-full truncate rounded-lg px-2 py-2 text-left text-sm font-semibold transition-colors ${
                              active
                                ? "bg-brand-soft text-brand-dark"
                                : "text-ink hover:bg-line-soft"
                            }`}
                          >
                            {employee?.name ?? peerEmployeeId}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <div className="space-y-4">
                {effectiveHrPeer ? (
                  <>
                    <Card>
                      <Eyebrow>
                        {getEmployeeById(state, effectiveHrPeer)?.name ??
                          effectiveHrPeer}{" "}
                        · 개인 채널
                      </Eyebrow>
                      <h3 className="mt-1 text-lg font-bold text-ink">
                        대화 내역
                      </h3>
                      <div className="mt-4 space-y-3">
                        {personalPosts.length === 0 ? (
                          <p className="text-sm text-ink-soft">
                            대화 내역이 없어요.
                          </p>
                        ) : (
                          personalPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                          ))
                        )}
                      </div>
                    </Card>

                    <Card>
                      <Eyebrow>인사팀 답변</Eyebrow>
                      <p className="mt-1 text-xs text-ink-faint">
                        답변은 &ldquo;{session?.name ?? "인사팀"}&rdquo; 이름으로
                        게시됩니다.
                      </p>
                      <textarea
                        value={hrReplyBody}
                        onChange={(e) => setHrReplyBody(e.target.value)}
                        placeholder="신규입사자에게 남길 답변"
                        rows={3}
                        className="mt-3 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                      />
                      <div className="mt-3">
                        <PrimaryButton
                          onClick={submitHrReply}
                          disabled={!hrReplyBody.trim()}
                        >
                          답변 보내기
                        </PrimaryButton>
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <p className="text-sm text-ink-soft">
                      목록에서 대화할 신규입사자를 선택하세요.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <>
              <Card>
                <Eyebrow>개인 채널 · HR 1:1</Eyebrow>
                <h3 className="mt-1 text-lg font-bold text-ink">
                  인사팀에게 문의하기
                </h3>
                <p className="mt-1 text-sm text-ink-soft">
                  온보딩·복지·팀 적응 등 HR만 볼 수 있는 비공개 채널입니다.
                </p>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={personalBody}
                    onChange={(e) => setPersonalBody(e.target.value)}
                    placeholder="궁금한 점이나 어려운 점을 편하게 적어주세요"
                    rows={4}
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      checked={personalAnonymous}
                      onChange={(e) => setPersonalAnonymous(e.target.checked)}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    익명으로 보내기
                  </label>
                  <PrimaryButton
                    onClick={submitPersonal}
                    disabled={!personalBody.trim()}
                  >
                    문의 보내기
                  </PrimaryButton>
                </div>
              </Card>

              <Card>
                <Eyebrow>대화 내역</Eyebrow>
                <div className="mt-3 space-y-3">
                  {personalPosts.length === 0 ? (
                    <p className="text-sm text-ink-soft">
                      아직 대화가 없어요. 첫 문의를 남겨보세요.
                    </p>
                  ) : (
                    personalPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-sm text-ink-faint">불러오는 중…</p>
        </div>
      }
    >
      <CommunityContent />
    </Suspense>
  );
}
