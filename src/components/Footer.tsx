import Image from "next/image";

function XIcon() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.171-5.401 6.171H2.74l7.726-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    </span>
  );
}

function TelegramIcon() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#2AABEE] shadow-[0_8px_20px_rgba(42,171,238,0.35)]">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
        <path
          fill="white"
          d="M21.5 3.4 18.7 21c-.2.9-.7 1.1-1.5.7l-4.2-3.1-2 1.9c-.2.2-.4.4-.9.4l.3-4.3 7.8-7c.3-.3 0-.5-.4-.2l-9.7 6.1-4.2-1.3c-.9-.3-.9-.9.2-1.3L20.3 2.6c.8-.3 1.5.2 1.2.8z"
        />
      </svg>
    </span>
  );
}

const LINKS = [
  { href: "https://x.com", label: "X", icon: <XIcon /> },
  { href: "https://t.me", label: "Telegram", icon: <TelegramIcon /> },
] as const;

export default function Footer() {
  return (
    <section className="bg-white px-3 pb-3 sm:px-5 sm:pb-5">
      <footer className="relative min-h-[280px] overflow-hidden rounded-[28px] sm:min-h-[340px] sm:rounded-[36px] md:min-h-[380px]">
        <Image
          src="/tweem-sky.png"
          alt=""
          fill
          className="object-cover object-top"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#5ec8ea]/20 via-transparent to-[#7ed4f0]/10" />

        <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between gap-12 px-8 py-10 sm:min-h-[340px] sm:px-12 sm:py-12 md:min-h-[380px] md:flex-row md:items-center md:px-16 lg:px-20">
          <div>
            <p className="text-[42px] leading-none font-black tracking-[-0.06em] text-white italic drop-shadow-[0_8px_18px_rgba(255,255,255,0.35)] sm:text-[56px] md:text-[64px]">
              tweets.family
            </p>
            <p className="mt-5 text-[13px] text-white/80 sm:text-[14px]">
              © 2026 tweets.family
            </p>
          </div>

          <div className="flex items-center gap-5 sm:gap-6">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="transition-transform hover:scale-105"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </section>
  );
}
