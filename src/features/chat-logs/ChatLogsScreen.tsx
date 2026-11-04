"use client";

import { useState } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { ROLE_LABEL, type Role } from "@/lib/auth-storage";
import { useApi } from "@/lib/use-api";

interface ChatSource {
  document: string;
  snippet: string;
  score: number | null;
}

interface ChatLogRow {
  id: number;
  at: string;
  member: boolean;
  name: string | null;
  role: Role | null;
  query: string;
  answer: string;
  sources: ChatSource[];
  status: "완료" | "멈춤" | "오류";
  error: string | null;
  durationMs: number | null;
  conversationId: string | null;
}

type Who = "all" | "member" | "guest";

/** 학원 안내 문서 파일 이름 → 제목 (web/content/guide의 NN-slug.md) */
const GUIDE_TITLES: Record<string, string> = {
  terms: "한빛수학 이용약관",
  fees: "수강료 및 환불 규정",
  attendance: "출결 및 보강 규정",
  privacy: "개인정보 처리 안내",
  schedule: "반 및 수업 시간표",
  teachers: "강사진 소개",
  exams: "시험 성적 안내",
  counsel: "학부모 상담 안내",
  "web-guide": "웹사이트 사용 안내",
  faq: "자주 묻는 질문",
};
function docTitle(name: string): string {
  const slug = /^\d{2}-([a-z-]+)/i.exec(name.trim())?.[1].toLowerCase();
  return (slug && GUIDE_TITLES[slug]) || name;
}

const STATUS_TONE = { 완료: "ok", 멈춤: "gray", 오류: "err" } as const;

function who(row: ChatLogRow): string {
  if (!row.member) return "손님";
  const role = row.role ? ROLE_LABEL[row.role] : "";
  return `${row.name ?? "탈퇴한 계정"}${role ? ` · ${role}` : ""}`;
}

/** 문의 기록 — 문의하기 챗봇의 질문·답·근거 (결정42, 원장만) */
export function ChatLogsScreen() {
  const [filter, setFilter] = useState<Who>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const { data, error } = useApi<ChatLogRow[]>(
    `/admin/chat-logs?who=${filter}`, { inline: true });
  const current = data?.find((row) => row.id === selected) ?? null;

  return (
    <>
      <PageHeader title="문의 기록" className="pt-4" />
      <p className="mb-4 text-body-sm text-muted">
        코어 웹 문의하기에서 받은 질문과 답, 답을 만들 때 찾은 근거예요. 근거
        점수가 낮거나 엉뚱한 문서가 많으면 학원 안내 문서나 검색 설정을
        고쳐요. IP는 남기지 않아요.
      </p>
      <div className="card flex flex-col gap-3">
        <FilterChips
          options={[
            { value: "all" as const, label: "전체" },
            { value: "member" as const, label: "로그인" },
            { value: "guest" as const, label: "손님" },
          ]}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setSelected(null);
          }}
        />
        {error && <EmptyState message={error} />}
        {!data && !error && <Skeleton className="h-48" />}
        {data && (
          <Table
            rows={data}
            rowKey={(r) => r.id}
            selectedKey={selected}
            onRowClick={(r) => setSelected(r.id === selected ? null : r.id)}
            empty={<EmptyState message="아직 받은 문의가 없어요." />}
            columns={[
              {
                key: "at",
                header: "시각",
                render: (r) => (
                  <span className="tabular-nums text-muted">
                    {r.at.slice(5)}
                  </span>
                ),
              },
              {
                key: "who",
                header: "누가",
                render: (r) => (
                  <span className={r.member ? "" : "text-subtle"}>
                    {who(r)}
                  </span>
                ),
              },
              {
                key: "query",
                header: "질문",
                render: (r) => (
                  <span className="line-clamp-1 max-w-[420px]">{r.query}</span>
                ),
              },
              {
                key: "status",
                header: "상태",
                render: (r) => (
                  <StatusBadge status={r.status} tone={STATUS_TONE[r.status]} />
                ),
              },
              {
                key: "sources",
                header: "근거",
                align: "right",
                render: (r) => (
                  <span className="tabular-nums text-muted">
                    {r.sources.length}개
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>

      {current && <Detail row={current} />}
    </>
  );
}

function Detail({ row }: { row: ChatLogRow }) {
  return (
    <section className="card mt-4 flex flex-col gap-5" aria-label="문의 내용">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-subtle">
        <span className="tabular-nums">{row.at}</span>
        <span>{who(row)}</span>
        {row.durationMs !== null && (
          <span className="tabular-nums">
            {(row.durationMs / 1000).toFixed(1)}초
          </span>
        )}
        {row.conversationId && (
          <span className="font-mono">
            대화 {row.conversationId.slice(0, 8)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-meta font-medium text-subtle">질문</h3>
        <p className="text-body whitespace-pre-wrap">{row.query}</p>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-meta font-medium text-subtle">답</h3>
        {row.answer ? (
          <p className="text-body whitespace-pre-wrap">{row.answer}</p>
        ) : (
          <p className="text-body text-subtle">답이 없어요.</p>
        )}
        {row.error && <p className="text-meta text-err">{row.error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-meta font-medium text-subtle">
          근거 {row.sources.length}개 (점수 높은 순)
        </h3>
        {row.sources.length === 0 ? (
          <p className="text-body-sm text-subtle">
            찾은 근거가 없어요. 지식 검색에서 아무 청크도 못 가져왔어요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {[...row.sources]
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .map((source, index) => (
                <li key={index} className="flex gap-4 py-3">
                  <span className="w-12 shrink-0 text-right text-body-sm font-bold tabular-nums">
                    {source.score === null ? "—" : source.score.toFixed(2)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body-sm font-medium">
                      {docTitle(source.document)}
                    </span>
                    <span className="line-clamp-2 text-meta text-muted">
                      {source.snippet}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
