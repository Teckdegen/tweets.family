export const MULTIPLIERS = ["2x", "5x", "10x", "25x"] as const;
export type Multiplier = (typeof MULTIPLIERS)[number];

export type Post = {
  handle: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  replies: string;
  rts: string;
  likes: string;
  market: string;
  odds: string;
  change: string;
  verified?: boolean;
};

export const POSTS = {
  nova: {
    handle: "@nova",
    name: "Nova",
    avatar: "/profile-nova.png",
    text: "this is about to print. bookmark it.",
    time: "14m",
    replies: "1.2k",
    rts: "8.4k",
    likes: "62k",
    market: "Engagement X",
    odds: "12x",
    change: "+3.2x",
    verified: true,
  },
  mira: {
    handle: "@mira",
    name: "Mira",
    avatar: "/profile-mira.png",
    text: "nobody is ready for this drop. 11pm.",
    time: "6m",
    replies: "840",
    rts: "4.1k",
    likes: "29k",
    market: "Engagement X",
    odds: "8x",
    change: "+1.4x",
    verified: true,
  },
  jax: {
    handle: "@jax",
    name: "Jax",
    avatar: "/avatar.png",
    text: "ratio incoming tbh. this one is not it.",
    time: "22m",
    replies: "3.8k",
    rts: "1.1k",
    likes: "9.4k",
    market: "Engagement X",
    odds: "2x",
    change: "-0.4x",
    verified: false,
  },
  rio: {
    handle: "@rio",
    name: "Rio",
    avatar: "/profile-rio.png",
    text: "this clip is criminal. if it doesn't hit a million I'm logging off.",
    time: "2m",
    replies: "412",
    rts: "8.2k",
    likes: "61k",
    market: "Engagement X",
    odds: "25x",
    change: "+6.1x",
    verified: true,
  },
  kai: {
    handle: "@kai",
    name: "Kai",
    avatar: "/kyle.png",
    text: "fade the quote tweets. the replies are where the real money is.",
    time: "31m",
    replies: "210",
    rts: "640",
    likes: "4.8k",
    market: "Engagement X",
    odds: "5x",
    change: "+0.8x",
    verified: true,
  },
} as const satisfies Record<string, Post>;
