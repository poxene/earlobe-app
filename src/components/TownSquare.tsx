import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EqualizerBars } from "@/components/EqualizerBars";
import { NowPlayingDock } from "@/components/NowPlayingBar";
import { ApiError, apiGet, apiSend } from "@/lib/api";
import { classById } from "@/lib/game/classes";
import { isRecord } from "@/lib/isRecord";
import { profilePath } from "@/lib/profile/handle";

type Listener = {
  name: string;
  className: string;
  level: number;
  trackName: string | null;
  artistName: string | null;
  trackColor: string | null;
};

type Message = {
  id: string;
  name: string;
  body: string;
  at: string;
};

function useTown() {
  return useQuery({
    queryKey: ["town"],
    queryFn: async () => {
      const body = await apiGet("/api/town");
      if (!isTown(body)) throw new Error("unexpected town");
      return body;
    },
    refetchInterval: 5_000,
  });
}

export function OnlineList() {
  const query = useTown();
  const [hot, setHot] = useState<string | null>(null);
  const online = query.data?.online ?? [];

  return (
    <section className="w-36 shrink-0 border border-white/10 bg-panel/90 p-2 sm:w-48">
      <h2 className="px-0.5 text-[11px] tracking-[0.28em] text-zinc-500">ONLINE</h2>
      {query.isPending ? <p className="mt-2 px-0.5 text-xs text-zinc-500">Looking around.</p> : null}
      {query.isSuccess && online.length === 0 ? <p className="mt-2 px-0.5 text-xs text-zinc-500">The square is quiet.</p> : null}
      <ul className="mt-1.5 max-h-72 space-y-1 overflow-y-auto">
        {online.map((listener) => {
          const color = classById(listener.className)?.color ?? "#64748b";
          const playing = listener.trackName
            ? listener.artistName
              ? `${listener.artistName} — ${listener.trackName}`
              : listener.trackName
            : "Silent";
          return (
            <li
              key={listener.name}
              className="flex items-center gap-1.5 rounded border border-white/10 px-1.5 py-1"
              onMouseEnter={() => setHot(listener.name)}
              onMouseLeave={() => setHot(null)}
            >
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded border border-white/15 text-[11px] font-black leading-none"
                style={{ color }}
                aria-label={`Level ${listener.level} ${listener.className}`}
              >
                {listener.level}
              </span>
              <div className="min-w-0 leading-tight">
                <Link to={profilePath(listener.name)} className="block truncate text-sm text-zinc-100 hover:text-gold">
                  {listener.name}
                </Link>
                <div className="flex min-w-0 items-center gap-1">
                  {listener.trackName ? <EqualizerBars active compact color={listener.trackColor ?? undefined} /> : null}
                  <NowPlaying text={playing} run={hot === listener.name} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const MIN_LOG = 64;
const MAX_LOG = 250;

function storedLogHeight(): number {
  try {
    const raw = Number(localStorage.getItem("earlobe.chatHeight"));
    if (Number.isFinite(raw)) return Math.min(MAX_LOG, Math.max(MIN_LOG, raw));
  } catch {
    // private mode
  }
  return MIN_LOG;
}

function clampLog(value: number): number {
  return Math.round(Math.min(MAX_LOG, Math.max(MIN_LOG, value)));
}

export function TownChat() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [logHeight, setLogHeight] = useState(storedLogHeight);
  const log = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const query = useTown();
  const messages = query.data?.messages ?? [];

  useEffect(() => {
    const next = clampLog(logHeight);
    if (next !== logHeight) setLogHeight(next);
    else localStorage.setItem("earlobe.chatHeight", String(next));
  }, [logHeight]);

  useEffect(() => {
    const node = dock.current;
    if (!node) return;
    const apply = () => document.documentElement.style.setProperty("--dock", `${Math.ceil(node.getBoundingClientRect().height)}px`);
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    apply();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--dock");
    };
  }, []);

  useEffect(() => {
    const node = log.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setNote("");
    try {
      await apiSend("/api/town/chat", "POST", { body });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["town"] });
    } catch (error) {
      setNote(error instanceof ApiError && error.code === "chat_fast" ? "Give it a second." : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  function onDragStart(event: PointerEvent<HTMLDivElement>) {
    drag.current = { y: event.clientY, height: logHeight };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDragMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    setLogHeight(clampLog(start.height + start.y - event.clientY));
  }

  function onDragEnd() {
    drag.current = null;
  }

  function onDragKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    setLogHeight((height) => clampLog(height + (event.key === "ArrowUp" ? 24 : -24)));
  }

  return (
    <section ref={dock} className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95">
      <div
        role="slider"
        aria-orientation="vertical"
        aria-label="Chat height"
        aria-valuemin={MIN_LOG}
        aria-valuemax={MAX_LOG}
        aria-valuenow={logHeight}
        tabIndex={0}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onKeyDown={onDragKey}
        className="flex h-3 w-full cursor-ns-resize touch-none items-center justify-center"
      >
        <span className="h-1 w-16 rounded-full bg-white/30 transition-colors hover:bg-white/70" />
      </div>
      <div className="flex w-full items-end gap-3 px-3 pb-2">
        <NowPlayingDock expanded={logHeight === MAX_LOG} />
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[10px] tracking-[0.28em] text-zinc-500">CHAT</h2>
            <div ref={log} className="mt-1 overflow-y-auto" style={{ height: logHeight }}>
              <div className="flex min-h-full flex-col justify-end space-y-0.5">
                {messages.length === 0 && query.isSuccess ? <p className="text-xs text-zinc-500">No one has spoken yet.</p> : null}
                {messages.map((message) => (
                  <p key={message.id} className="truncate text-sm text-zinc-300">
                    <Link to={profilePath(message.name)} className="text-gold hover:text-gold-2">
                      {message.name}
                    </Link>
                    <span> {message.body}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
          <form
            className="flex w-full shrink-0 gap-2 sm:max-w-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 240))}
              className="min-w-0 flex-1 border border-white/15 bg-ink px-3 py-1.5 text-sm text-zinc-100"
              placeholder="Say something"
              aria-label="Town chat"
              maxLength={240}
            />
            <button type="submit" disabled={busy || draft.trim().length === 0} className="bg-gold px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-40">
              Send
            </button>
          </form>
        </div>
      </div>
      {note ? <p className="px-3 pb-2 text-xs text-gold">{note}</p> : null}
    </section>
  );
}

function NowPlaying({ text, run }: { text: string; run: boolean }) {
  const line = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const node = line.current;
    if (!run || !node) {
      setShift(0);
      return;
    }
    const overflow = node.scrollWidth - node.clientWidth;
    setShift(overflow > 4 ? overflow : 0);
  }, [run, text]);

  const duration = Math.round(Math.min(9000, Math.max(1800, shift * 24)));
  return (
    <p className="min-w-0 flex-1 overflow-hidden text-[11px] leading-tight text-zinc-500">
      <span
        ref={line}
        className={shift ? "town-marquee inline-block whitespace-nowrap" : "block truncate"}
        style={shift ? { ["--marquee-shift" as string]: `-${shift}px`, animationDuration: `${duration}ms` } : undefined}
      >
        {text}
      </span>
    </p>
  );
}

function isTown(value: unknown): value is { online: Listener[]; messages: Message[] } {
  return isRecord(value) && Array.isArray(value.online) && Array.isArray(value.messages);
}
