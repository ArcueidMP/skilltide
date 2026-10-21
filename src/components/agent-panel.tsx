"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { replanMessage, respond, suggestionsFor, type AgentContext, type AgentMessage } from "@/lib/agent";
import { useAnalysis } from "@/lib/use-analysis";
import { Badge } from "./ui";
import { CitationList } from "./citations";

export function AgentPanel() {
  const pathname = usePathname();
  const store = useStore();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const analysis = useAnalysis();
  const context: AgentContext = {
    pathname,
    store,
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

  // Automatic re-planning: when the scenario or data snapshot changes, say what moved.
  const seen = useRef<{ key: string; top: string | null } | null>(null);
  const topRole = analysis.matches[0]?.roleId ?? null;
  const viewKey = `${store.scenario}|${store.snapshotId}`;
  useEffect(() => {
    if (!store.hydrated) return;
    const previous = seen.current;
    seen.current = { key: viewKey, top: topRole };
    if (!previous || previous.key === viewKey || !topRole) return;
    const message = replanMessage(previous.top, context);
    if (message) setMessages((current) => [...current, { ...message, id: `m${nextId.current++}` }]);
    // context is rebuilt every render; the key and top role capture what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, topRole, store.hydrated]);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const answer = respond(text, context);
    setMessages((current) => [
      ...current,
      { id: `m${nextId.current++}`, role: "user", text },
      { ...answer, id: `m${nextId.current++}` },
    ]);
    setDraft("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const suggestions = suggestionsFor(pathname);

  return (
    <section
      aria-label="SkillTide guide"
      className="glass flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 animate-orb rounded-full bg-[radial-gradient(circle_at_35%_30%,#ccfbf1,#2dd4bf_45%,#6366f1_100%)]"
            aria-hidden
          />
          <div>
            <p className="font-display text-sm font-semibold">SkillTide Guide</p>
            <p className="text-[11px] text-muted">Answers only from SkillTide data</p>
          </div>
        </div>
        <Badge tone="neutral">Rule-based</Badge>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-lg bg-surface-muted p-3 text-[13px] leading-relaxed text-ink-soft">
            I explain why SkillTide ranks things the way it does, and every answer points to its
            source. I don&apos;t invent jobs, courses or numbers — if the data doesn&apos;t cover
            something, I&apos;ll say so.
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "border border-brand/30 bg-brand-soft text-ink"
                  : message.kind === "replan"
                    ? "border border-accent/40 bg-accent-soft text-ink"
                    : "border border-border bg-surface-muted text-ink",
              )}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              {message.citations?.length ? (
                <CitationList citations={message.citations} className="mt-2" />
              ) : null}
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
                onClick={() => ask(suggestion)}
                className="rounded-full border border-border px-2.5 py-1 text-[12px] text-ink-soft hover:border-brand hover:text-brand-strong"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="agent-input" className="sr-only">
            Ask the guide
          </label>
          <input
            id="agent-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask why, what if, or where from…"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:border-brand"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-brand to-cyan-300 text-brand-ink shadow-[0_0_16px_rgba(45,212,191,0.4)]"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
