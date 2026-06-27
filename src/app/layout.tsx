import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PakIndex — HORECA Intelligence",
  description: "Pakistan's first HORECA Intelligence & Sales Platform. Discover, track, and analyze restaurants and food businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          // Runs before paint so the admin panel never flashes light-then-dark.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('pakindex-dark-mode');if(m==='true'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen relative z-10">{children}</body>
    </html>
  );
}
