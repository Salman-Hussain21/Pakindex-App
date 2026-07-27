import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PakIndex",
  description: "Pakistan's first HORECA Intelligence & Sales Platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required here because the inline script
    // below intentionally adds/removes the "dark" class on <html> before
    // React hydrates (reading a saved preference from localStorage). That
    // makes the client's className legitimately differ from the server-
    // rendered markup for a moment — this is the exact, documented pattern
    // Next.js recommends for theme-bootstrap scripts, and it only silences
    // the warning on this one element, not the rest of the tree.
    // See: https://nextjs.org/docs/app/api-reference/functions/generate-static-params#suppresshydrationwarning
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('pakindex-dark-mode');if(m==='true'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#070B09" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      {/*
        No manual Google Fonts <link> tags here — page.tsx already loads
        Space Grotesk / Inter / IBM Plex Mono via next/font/google, which
        self-hosts them and injects the right font automatically (no extra
        network round trip, no flash of unstyled text, no font-family
        fight with the CSS variables the page sets on <main>). A second,
        manually-linked Inter from the Google Fonts CDN plus a hardcoded
        inline font-family here was fighting that — removed both.
      */}
      <body className="min-h-screen relative z-10">{children}</body>
    </html>
  );
}