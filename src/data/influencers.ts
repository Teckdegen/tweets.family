export type Influencer = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  followers: number;
  avatar: string;
};

// Display name, handle, bio, and photo are the public X profile.
export const INFLUENCERS: Influencer[] = [
  {
    id: "cz",
    name: "CZ 🔶 BNB",
    handle: "cz_binance",
    bio: "Buy the book (proceeds go to charity):\nEnglish: https://a.co/d/08NMxBOH\nChinese: https://a.co/d/01f7iQTn\n\n@binance\n@BNBchain\n@YZiLabs\n@GiggleAcademy",
    followers: 12961850,
    avatar: "/influencers/cz.jpg",
  },
  {
    id: "vlad",
    name: "Vlad Tenev",
    handle: "vladtenev",
    bio: "CEO and Co-Founder @RobinhoodApp 📈📱Executive Chairman and Co-Founder @HarmonicMath 👁️‍🗨️👨‍🏫",
    followers: 1082659,
    avatar: "/influencers/vlad.jpg",
  },
  {
    id: "elon",
    name: "Elon Musk",
    handle: "elonmusk",
    bio: "http://Terafab.AI",
    followers: 241731308,
    avatar: "/influencers/elon.jpg",
  },
  {
    id: "ansem",
    name: "Ansem 🐂🀄️",
    handle: "blknoiz06",
    bio: "coldest nigga breathing | @BullpenFi @MarketBubble",
    followers: 1432393,
    avatar: "/influencers/ansem.jpg",
  },
  {
    id: "ozzy",
    name: "Ozzy | 奥兹 🅿️",
    handle: "MEADGod",
    bio: "@rootsfi | Pushin’ 🅿️ @ponsdotfamily\n\nNothing on my profile is financial advice. Opinions are my own. RTs and QTs != endorsement.",
    followers: 72073,
    avatar: "/influencers/ozzy.jpg",
  },
  {
    id: "vitalik",
    name: "vitalik.eth",
    handle: "VitalikButerin",
    bio: "I choose balance. First-level balance.\n\nmi pinxe lo crino tcati\n\nhttps://slatestarcodex.com/2018/09/12/in-the-balance/",
    followers: 7960240,
    avatar: "/influencers/vitalik.jpg",
  },
  {
    id: "brian",
    name: "Brian Armstrong",
    handle: "brian_armstrong",
    bio: "Co-founder & CEO @Coinbase. Creating more economic freedom in the world. Co-founder @researchhub @newlimit.\nNot investment advice.",
    followers: 3976059,
    avatar: "/influencers/brian.jpg",
  },
  {
    id: "mert",
    name: "mert",
    handle: "mert",
    bio: "ceo @helius — Solana RPCs, APIs & data: http://helius.dev — bare-knuckle typist",
    followers: 2349711,
    avatar: "/influencers/mert.jpg",
  },
];

export function influencerById(id: string) {
  return INFLUENCERS.find((person) => person.id === id) ?? null;
}
