import type { Metadata } from "next";
import { Manrope, Readex_Pro } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const readexPro = Readex_Pro({
  variable: "--font-readex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const title = "tweets.cc";
const ogImage = {
  url: "/og-image.jpg",
  width: 1280,
  height: 426,
  alt: "tweets.cc",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tweetsfamily.vercel.app"),
  title,
  openGraph: {
    title,
    siteName: title,
    url: "/",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    images: [ogImage],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${readexPro.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900,701&display=swap"
        />
      </head>
      <body className="h-full min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
