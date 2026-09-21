"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { POSTS } from "@/data/posts";

type Tone = "slate" | "ice" | "mint" | "gold" | "pink" | "white" | "navy";
type Drift = "pop-note" | "pop-note-left" | "pop-note-up" | "pop-note-right";

type Note = {
  id: number;
  title: string;
  body: string;
  avatar?: string;
  left: number;
  top: number;
  tone: Tone;
  drift: Drift;
  size: "sm" | "md";
};

type Payload = {
  title: string;
  body: string;
  avatar?: string;
  tone?: Tone;
};

type Ctx = {
  notify: (note: Payload) => void;
};

const TONES: Tone[] = ["slate", "ice", "mint", "gold", "pink", "white", "navy"];
const DRIFTS: Drift[] = ["pop-note", "pop-note-left", "pop-note-up", "pop-note-right"];

const TONE_CLASS: Record<Tone, string> = {
  slate: "bg-[#1b3a4a] text-white",
  ice: "bg-[#d7f3fa] text-[#245062]",
  mint: "bg-[#d8f5ea] text-[#1f6b4a]",
  gold: "bg-[#fff1c4] text-[#7a5a10]",
  pink: "bg-[#ffe1ea] text-[#8a3050]",
  white: "bg-white text-[#1b3a4a]",
  navy: "bg-[#152238] text-white",
};

const PEOPLE = [POSTS.mira, POSTS.nova, POSTS.rio, POSTS.jax, POSTS.kai];
const XS = ["2x", "5x", "8x", "10x", "12x", "18x", "25x"] as const;

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function autoNote(): Payload {
  const person = pick(PEOPLE);
  const other = pick(PEOPLE.filter((item) => item.handle !== person.handle));
  const x = pick(XS);
  const tone = pick(TONES);
  const templates: Payload[] = [
    {
      title: `${person.handle} popped`,
      body: `${person.odds} live engagement — bet the X`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `Someone just hit ${x}`,
      body: `${person.handle} ripping in real time`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `New post from ${person.handle}`,
      body: person.text,
      avatar: person.avatar,
      tone,
    },
    {
      title: `${person.handle} replies cooking`,
      body: `${person.replies} replies · ${x} on engagement`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `Quote storm on ${person.handle}`,
      body: `${person.rts} RTs — this might go ${x}`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `${other.handle} faded ${person.handle}`,
      body: `Took the ${x} under`,
      avatar: other.avatar,
      tone,
    },
    {
      title: `Likes spiking`,
      body: `${person.handle} just crossed ${person.likes}`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `Whale bet ${x}`,
      body: `Big size printed on ${person.handle}`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `Ratio watch`,
      body: `${person.handle} replies > likes — ${x} still live`,
      avatar: person.avatar,
      tone,
    },
    {
      title: `${person.handle} just quoted ${other.handle}`,
      body: `Market jumped to ${x}`,
      avatar: person.avatar,
      tone,
    },
  ];
  return pick(templates);
}

const NotifyContext = createContext<Ctx | null>(null);

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error("useNotify must be used inside NotifyProvider");
  }
  return ctx.notify;
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [show, setShow] = useState(true);
  const idRef = useRef(0);

  const notify = useCallback((note: Payload) => {
    const id = ++idRef.current;
    const item: Note = {
      id,
      title: note.title,
      body: note.body,
      avatar: note.avatar,
      tone: note.tone ?? pick(TONES),
      left: 3 + Math.random() * 72,
      top: 6 + Math.random() * 78,
      drift: pick(DRIFTS),
      size: Math.random() > 0.7 ? "sm" : "md",
    };
    setNotes((current) => [...current.slice(-13), item]);
    window.setTimeout(() => {
      setNotes((current) => current.filter((entry) => entry.id !== id));
    }, 3800);
  }, []);

  useEffect(() => {
    if (!show) {
      setNotes([]);
      return;
    }
    notify(autoNote());
    notify(autoNote());
    const timer = window.setInterval(() => {
      notify(autoNote());
      if (Math.random() > 0.5) notify(autoNote());
    }, 920);
    return () => window.clearInterval(timer);
  }, [notify, show]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      {show ? (
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`${note.drift} absolute flex items-center gap-2 rounded-[22px] px-3 py-2.5 shadow-[0_16px_40px_rgba(40,80,110,0.22)] ${TONE_CLASS[note.tone]} ${
              note.size === "sm" ? "max-w-[210px]" : "max-w-[300px]"
            }`}
            style={{ left: `${note.left}%`, top: `${note.top}%` }}
          >
            {note.avatar ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40">
                <Image
                  src={note.avatar}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="32px"
                />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold">{note.title}</p>
              <p className="truncate text-[11px] opacity-80">{note.body}</p>
            </div>
          </div>
        ))}
      </div>
      ) : null}
    </NotifyContext.Provider>
  );
}
