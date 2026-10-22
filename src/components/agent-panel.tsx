"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { replanMessage, suggestionsFor, type AgentContext, type AgentMessage } from "@/lib/agent";
import { toApiProfile } from "@/lib/api-types";
import { askGuide } from "@/lib/guide-client";
import { pathwayDone } from "@/lib/progress";
import { useAnalysis } from "@/lib/use-analysis";
import { useMessages } from "@/lib/use-messages";
import { useProgressNote } from "@/lib/use-progress-note";
import { GUIDE_PANEL } from "@/messages/guide";
import { Segmented } from "./ui";
import { CitationList } from "./citations";

export function AgentPanel() {
  const pathname = usePathname();
  const store = useStore();
  const t = useMessages(GUIDE_PANEL);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const analysis = useAnalysis();
  const context: AgentContext = {
    pathname,
    locale: store.locale,
    profile: store.profile,
    weights: store.weights,
    snapshot: analysis.snapshot,
    scenario: analysis.scenario,
    matches: analysis.matches,
    outlooks: analysis.outlooks,
    trends: analysis.trends,
    pathway: analysis.pathway,
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Automatic re-planning: when results for a new scenario or data snapshot arrive, say what moved.
  const seen = useRef<{ key: string; top: string | null } | null>(null);
  const topRole = analysis.matches[0]?.roleId ?? null;
  const viewKey = analysis.basis;
  useEffect(() => {
    if (!store.hydrated || !viewKey) return;
    const previous = seen.current;
    seen.current = { key: viewKey, top: topRole };
    if (!previous || previous.key === viewKey || !topRole) return;
    const message = replanMessage(previous.top, context);
    if (message) setMessages((current) => [...current, { ...message, id: `m${nextId.current++}` }]);
    // context is rebuilt every render; the key and top role capture what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, topRole, store.hydrated]);

  // After a pathway step is marked done, say what changed once the re-planned results arrive.
  const postNote = useCallback((text: string) => {
    setMessages((current) => [...current, { id: `m${nextId.current++}`, role: "agent", kind: "replan", text }]);
  }, []);
  useProgressNote(analysis, postNote);

  async function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const userId = `m${nextId.current++}`;
    const replyId = `m${nextId.current++}`;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text },
      {
        id: replyId,
        role: "agent",
        text: store.aiWording ? t.pendingAi : t.pendingRules,
        pending: true,
      },
    ]);
    setDraft("");
    const reply = await askGuide(text, context, {
      ai: store.aiWording,
      snapshot: analysis.snapshot?.id ?? "latest",
      scenario: store.scenario,
      weights: store.weights,
      profile: store.profile ? toApiProfile(store.profile) : null,
      targetRoleId: store.targetRoleId,
      done: pathwayDone(store.progress),
      locale: store.locale,
    });
    setMessages((current) => current.map((message) => (message.id === replyId ? { ...reply, id: replyId } : message)));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  const suggestions = suggestionsFor(pathname, store.locale);

  return (
    <section
      aria-label={t.region}
      className="panel flex h-full flex-col overflow-hidden rounded-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent" aria-hidden>
            <LifeBuoy className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold">{t.title}</p>
            <p className="text-[11px] text-muted">{t.subtitle}</p>
          </div>
        </div>
        <Segmented
          size="sm"
          label={t.modeLabel}
          value={store.aiWording ? "ai" : "rules"}
          options={[
            { value: "rules", label: t.rules },
            { value: "ai", label: t.ai },
          ]}
          onChange={(value) => store.update({ aiWording: value === "ai" })}
        />
      </div>
      {store.aiWording ? (
        <p className="border-b border-border bg-surface-muted px-4 py-2 text-[11.5px] leading-relaxed text-ink-soft">
          {t.aiDisclosure}
        </p>
      ) : null}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-lg bg-surface-muted p-3 text-[13px] leading-relaxed text-ink-soft">{t.intro}</div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              aria-busy={message.pending || undefined}
              className={cn(
                "max-w-[92%] rounded-md px-3 py-2 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "border border-ink/20 bg-brand-soft text-ink"
                  : message.kind === "replan"
                    ? "border border-accent/40 bg-accent-soft text-ink"
                    : "border border-border bg-surface-muted text-ink",
                message.pending && "text-muted",
              )}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              {message.citations?.length ? (
                <CitationList citations={message.citations} className="mt-2" />
              ) : null}
              {message.engine === "ai" ? (
                <p className="mt-2 text-[11px] text-muted">{t.wordedBy(message.model ?? "")}</p>
              ) : null}
              {message.note ? <p className="mt-2 text-[11px] text-muted">{message.note}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        {suggestions.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void ask(suggestion)}
                className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-[12px] text-ink-soft hover:border-ink/50 hover:text-ink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="agent-input" className="sr-only">
            {t.inputLabel}
          </label>
          <input
            id="agent-input"
            value={draft}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t.placeholder}
            className="h-9 min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:border-brand"
          />
          <button
            type="submit"
            aria-label={t.send}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-brand-ink hover:bg-brand-strong"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
