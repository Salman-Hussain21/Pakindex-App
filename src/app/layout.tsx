import type { Metadata } from "next";
import "./globals.css";
import { poppins, montserrat } from "@/lib/fonts";

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
        Fonts are defined once in src/lib/fonts.ts and injected here at root
        level. This ensures Next.js produces a single layout.css font chunk
        instead of a separate one per sub-layout (admin/company).
        The CSS variables --font-poppins and --font-montserrat are now
        available to every page and layout in the tree.
      */}
      <body className={`${poppins.variable} ${montserrat.variable} min-h-screen relative z-10`}>
        {children}
      </body>
    </html>
  );
}