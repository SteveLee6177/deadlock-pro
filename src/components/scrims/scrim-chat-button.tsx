"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, MessageSquare, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ScrimChatEntity,
  ScrimChatMessage,
  ScrimConversationSummary,
} from "@/lib/types";

type ChatStatus = "idle" | "loading" | "live" | "fallback" | "error";

function mergeMessages(
  previous: ScrimChatMessage[],
  incoming: ScrimChatMessage[],
) {
  const byId = new Map(previous.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildConversationUrl(entity: ScrimChatEntity) {
  const params = new URLSearchParams(
    entity.kind === "request"
      ? { requestId: entity.id }
      : { scrimId: entity.id },
  );

  return `/api/scrims/conversations?${params.toString()}`;
}

export function ScrimChatButton({
  entity,
  label = "Chat",
}: {
  entity: ScrimChatEntity;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [conversation, setConversation] = useState<ScrimConversationSummary | null>(null);
  const [messages, setMessages] = useState<ScrimChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [senderTeamId, setSenderTeamId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    fetch(buildConversationUrl(entity))
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Could not open scrim chat.");
        }

        return (await response.json()) as ScrimConversationSummary;
      })
      .then((payload) => {
        if (isCancelled) {
          return;
        }

        setConversation(payload);
        setMessages(payload.messages);
        setSenderTeamId(payload.manageableTeamIds[0] ?? "");
        setStatus("live");
      })
      .catch((error: Error) => {
        if (isCancelled) {
          return;
        }

        setStatus("error");
        setFeedback(error.message);
      });

    return () => {
      isCancelled = true;
    };
  }, [entity, isOpen]);

  useEffect(() => {
    if (!isOpen || !conversation) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const params = new URLSearchParams();

    if (lastMessage) {
      params.set("after", lastMessage.createdAt);
    }

    const source = new EventSource(
      `/api/scrims/conversations/${conversation.id}/events?${params.toString()}`,
    );

    source.onopen = () => setStatus("live");
    source.onerror = () => {
      setStatus("fallback");
      source.close();
    };
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { kind: "messages"; messages: ScrimChatMessage[] }
          | { kind: "status"; title: string };

        if (payload.kind === "messages") {
          setMessages((current) => mergeMessages(current, payload.messages));
        }
      } catch {
        setStatus("fallback");
      }
    };

    return () => source.close();
    // Only open one stream per conversation. Re-running on every message would reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isOpen]);

  const teamOptions = useMemo(() => {
    if (!conversation) {
      return [];
    }

    return conversation.teams.filter((team) =>
      conversation.manageableTeamIds.includes(team.id),
    );
  }, [conversation]);
  const ownTeamIds = useMemo(
    () => new Set(conversation?.manageableTeamIds ?? []),
    [conversation?.manageableTeamIds],
  );
  const portalRoot = typeof document === "undefined" ? null : document.body;

  function sendMessage() {
    if (!conversation || body.trim().length === 0) {
      return;
    }

    const nextBody = body;
    setBody("");

    startTransition(async () => {
      const response = await fetch(`/api/scrims/conversations/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: nextBody,
          senderTeamId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: ScrimChatMessage | string }
        | null;

      if (!response.ok || !payload || typeof payload.message === "string") {
        setFeedback(
          typeof payload?.message === "string"
            ? payload.message
            : "Message could not be sent.",
        );
        setBody(nextBody);
        return;
      }

      setFeedback(null);
      setMessages((current) => mergeMessages(current, [payload.message as ScrimChatMessage]));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("loading");
          setFeedback(null);
          setIsOpen(true);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
      >
        <MessageSquare className="h-4 w-4" />
        {label}
      </button>

      {portalRoot && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6"
              onClick={() => setIsOpen(false)}
            >
              <section
                className="flex h-[min(640px,calc(100dvh-48px))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-[#0a1724] shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line p-4">
                  <div className="min-w-0">
                    <p className="eyebrow">Scrim Chat</p>
                    <h2 className="mt-2 truncate font-display text-2xl font-bold text-white">
                      {conversation?.title ?? "Loading chat"}
                    </h2>
                    {conversation?.subtitle ? (
                      <p className="mt-1 text-sm text-muted">{conversation.subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:text-white"
                    aria-label="Close scrim chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>

                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {status === "loading" ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Loading chat
                    </div>
                  ) : null}

                  {messages.map((message) => {
                    const isOutgoing = ownTeamIds.has(message.senderTeamId);

                    return (
                      <article
                        key={message.id}
                        className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[82%] rounded-2xl px-4 py-3 shadow-sm",
                            isOutgoing
                              ? "rounded-br-md bg-accent text-slate-950"
                              : "rounded-bl-md border border-line bg-white/5 text-slate-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]",
                              isOutgoing ? "text-slate-800" : "text-muted",
                            )}
                          >
                            <p className="font-semibold uppercase tracking-[0.16em]">
                              {message.senderTeamName}
                            </p>
                            <p>
                              {message.senderName} - {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                            {message.body}
                          </p>
                        </div>
                      </article>
                    );
                  })}

                  {status !== "loading" && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted">
                      No messages yet
                    </div>
                  ) : null}
                </div>

                <form
                  className="sticky bottom-0 z-10 shrink-0 border-t border-line bg-[#0a1724] p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  {teamOptions.length > 1 ? (
                    <select
                      value={senderTeamId}
                      onChange={(event) => setSenderTeamId(event.target.value)}
                      className="mb-3 h-10 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
                    >
                      {teamOptions.map((team) => (
                        <option key={team.id} value={team.id} className="bg-slate-950">
                          {team.name}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="flex gap-3">
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={!conversation || isPending}
                      placeholder="Message the other team"
                      className="min-h-12 flex-1 resize-none rounded-[14px] border border-line bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-accent disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!conversation || isPending || body.trim().length === 0}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send scrim chat message"
                    >
                      {isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                    <span>{status === "live" ? "Live" : status === "fallback" ? "Reconnecting" : ""}</span>
                    {feedback ? <span className="text-rose-200">{feedback}</span> : null}
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
