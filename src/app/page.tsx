"use client";

import { useEffect, useRef, useState } from "react";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";

// ─────────────────────────────────────────────────────────────────────────
// Fonts Configuration
// ─────────────────────────────────────────────────────────────────────────
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// ─────────────────────────────────────────────────────────────────────────
// Content & Configuration
// ─────────────────────────────────────────────────────────────────────────
const AREAS = [
  "PECHS, Karachi",
  "DHA, Karachi",
  "Clifton, Karachi",
  "Gulshan, Karachi",
  "Gulberg, Lahore",
  "F-7, Islamabad",
];

const ROLE_TABS = [
  {
    id: "admin",
    label: "Admin",
    eyebrow: "SUPER ADMIN · DATA CONTROL",
    title: "Every listing is scraped, checked, then approved.",
    body: "Nothing reaches a company's CRM until it clears the admin queue — duplicate detection, manual review, and a full audit trail on every record.",
    bullets: [
      "Live scrape queue with duplicate detection",
      "Bulk approve, reject, or merge records",
      "Company accounts, subscriptions & audit logs",
    ],
    mock: "admin",
    secondary: {
      mock: "scraped",
      caption: "Every scrape run is logged by query and area — so admins know exactly what was searched, and what's still waiting for review.",
    },
  },
  {
    id: "company",
    label: "Company",
    eyebrow: "COMPANY · TERRITORY CRM",
    title: "Your restaurant universe, assigned and tracked.",
    body: "Companies get their slice of the verified database, mapped to territories, with a live CRM pipeline and a roster of field employees to run it.",
    bullets: [
      "Territory-based restaurant database with search & filters",
      "Assign leads to reps by area, category, or rating",
      "Stale-lead alerts when a deal has gone quiet",
    ],
    mock: "company",
    secondary: {
      mock: "restaurants",
      caption: "Search by name or phone, filter by area, category or rating, and assign any outlet to a rep in one click.",
    },
  },
  {
    id: "field",
    label: "Field Team",
    eyebrow: "FIELD EMPLOYEE · ON THE GROUND",
    title: "A pocket workspace for the person doing the visit.",
    body: "Reps open the map, see what's assigned nearby, and move a lead across the pipeline the moment the conversation happens — no notebook required.",
    bullets: [
      "Assigned leads, visits & conversion rate at a glance",
      "Kanban pipeline: New → Contacted → Proposal → Won",
      "Quota progress with live commission estimates",
    ],
    mock: "field",
    secondary: null,
  },
] as const;

const FLOW_STEPS = [
  { n: "01", area: "Karachi · Lahore · Islamabad", title: "Scrape & discover", text: "Raw HORECA listings are pulled city by city, grid cell by grid cell." },
  { n: "02", area: "Admin queue", title: "Verify & de-duplicate", text: "An admin reviews every entry and merges anything scraped twice." },
  { n: "03", area: "Company account", title: "Territory assigned", text: "A subscribing company gets its outlets mapped to its own areas." },
  { n: "04", area: "Employee roster", title: "Leads distributed", text: "Field reps are handed the outlets that fall in their patch." },
  { n: "05", area: "On-site visit", title: "Visit & update", text: "Reps log the visit and move the lead across the pipeline in real time." },
  { n: "06", area: "Both dashboards", title: "Insight flows back", text: "Company and admin dashboards update instantly — the loop closes." },
];

const FEATURES = [
  {
    title: "Verified, not crowdsourced",
    text: "Every listing passes an admin approval pipeline with duplicate detection before it's usable — not an open, unmoderated directory.",
    icon: "database",
  },
  {
    title: "Map-first fieldwork",
    text: "Territory maps with clustering point a rep at the next real opportunity nearby, instead of a flat spreadsheet row.",
    icon: "map",
  },
  {
    title: "Three roles, one system",
    text: "Admin, company and field employee each get a dashboard built for their job — not one generic CRM stretched three ways.",
    icon: "layers",
  },
  {
    title: "A pipeline that's actually used",
    text: "New → Contacted → Interested → Meeting → Proposal → Won. Drag-and-drop, on a screen a rep will actually open in the field.",
    icon: "kanban",
  },
  {
    title: "Performance built in",
    text: "Quotas, conversion rate and commission estimates are live for every rep — no separate spreadsheet at month-end.",
    icon: "chart",
  },
  {
    title: "Coverage that keeps growing",
    text: "Scraping runs continuously, so the index grows with the city instead of aging like a one-time import.",
    icon: "sync",
  },
];

const FAQS = [
  {
    q: "How is business data collected and verified?",
    a: "PakIndex scrapes HORECA listings city by city, then routes every result through an admin review queue with duplicate detection before it's approved into the live database. You can also require phone-verified listings only, which trades some coverage for stricter data quality.",
  },
  {
    q: "Which cities and areas are covered right now?",
    a: "Coverage is heaviest in Karachi (PECHS, DHA, Clifton, Gulshan and more), with Lahore (Gulberg) and Islamabad (F-7) already indexed and new areas added as scraping runs continue.",
  },
  {
    q: "Can I limit what a rep sees to their own territory?",
    a: "Yes. Field employees only see the outlets and leads assigned to their area — the same database, scoped by role and territory rather than one shared, unfiltered list.",
  },
  {
    q: "How does billing work?",
    a: "Companies subscribe to a plan sized to their team and territory coverage, with room to upgrade as coverage grows. Get in touch and we'll size a plan around your sales team.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { ref, visible } = useReveal<HTMLSpanElement>();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, value]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </>
    ),
    map: (
      <>
        <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" />
        <path d="M9 7v13M15 4v13" />
      </>
    ),
    layers: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
    kanban: (
      <>
        <rect x="3" y="4" width="6" height="16" rx="1" />
        <rect x="9.5" y="4" width="6" height="10" rx="1" />
        <rect x="16" y="4" width="6" height="13" rx="1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M11 20V4M18 20v-7" />
      </>
    ),
    sync: (
      <>
        <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
        <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
        <path d="M3 16v4h4M21 8V4h-4" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    check: <path d="M20 6 9 17l-5-5" />,
    building: (
      <>
        <rect x="4" y="3" width="10" height="18" rx="1" />
        <rect x="15" y="8" width="5" height="13" rx="1" />
        <path d="M7 7h2M7 11h2M7 15h2" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h5a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" />
      </>
    ),
    shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Dynamic Visual Components
// ─────────────────────────────────────────────────────────────────────────
const SCAN_COLS = 12;
const SCAN_ROWS = 7;
const LIT_CELLS = new Set([
  4, 5, 6, 16, 17, 18, 19, 28, 29, 30, 40, 41, 42, 43, 52, 53, 54, 55, 65, 66,
  67, 68, 77, 78, 79, 80, 25, 26, 37, 38, 49, 50, 61, 62, 73, 74, 14, 15, 27,
]);

function ScanGrid() {
  const total = SCAN_COLS * SCAN_ROWS;
  return (
    <div className="relative">
      <div
        className="grid gap-[3px] sm:gap-1"
        style={{ gridTemplateColumns: `repeat(${SCAN_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const lit = LIT_CELLS.has(i);
          return (
            <div
              key={i}
              className={`aspect-square rounded-[2px] ${
                lit ? "bg-[var(--forest-bright)]" : "bg-white/[0.06]"
              }`}
              style={
                lit
                  ? {
                      animation: "pk-cell-pulse 3.2s ease-in-out infinite",
                      animationDelay: `${(i % 11) * 0.18}s`,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      <div className="pointer-events-none absolute -left-3 top-[18%] hidden sm:block">
        <div
          className="flex items-center gap-2 rounded-full bg-[var(--ink)]/90 border border-white/15 pl-2 pr-3 py-1.5 shadow-lg"
          style={{ animation: "pk-float 5s ease-in-out infinite" }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--forest-bright)] text-[var(--ink)]">
            <Icon name="pin" className="w-3 h-3" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-white">
            Chai Chatt <span className="text-white/80">★4.6</span>
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-2 bottom-[10%] hidden sm:block">
        <div
          className="flex items-center gap-2 rounded-full bg-[var(--ink)]/90 border border-white/15 pl-2 pr-3 py-1.5 shadow-lg"
          style={{ animation: "pk-float 5s ease-in-out infinite 1.4s" }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--ink)]">
            <Icon name="pin" className="w-3 h-3" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-white">
            Bella Vita <span className="text-white/80">★4.0</span>
          </span>
        </div>
      </div>
    </div>
  );
}

const MAP_PINS = [
  { x: 22, y: 30, label: "Chai Chatt", rating: "4.6", big: true },
  { x: 38, y: 22, label: "Bella Vita", rating: "4.0" },
  { x: 55, y: 40, label: "Cocochan", rating: "4.4", big: true },
  { x: 70, y: 26, label: "Okra", rating: "4.7" },
  { x: 30, y: 58, label: "Xander's", rating: "4.2" },
  { x: 63, y: 62, label: "Kebabjees", rating: "4.1", big: true },
  { x: 80, y: 55, label: "Sind Club", rating: "4.8" },
  { x: 46, y: 72, label: "Cafe Flo", rating: "3.9" },
];

function MapPreview() {
  return (
    <div className="pk-tilt relative rounded-2xl border border-white/10 pk-glass p-3 sm:p-4 shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-white/50 tracking-wider uppercase">
          KARACHI · DHA &amp; CLIFTON TERRITORY
        </span>
        <span className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--forest-bright)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-bright)] animate-pulse" />
          live
        </span>
      </div>

      <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{ background: "#060A08" }}>
        <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="pk-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100" height="75" fill="url(#pk-grid)" />
          <path d="M0 15 H100 M0 40 H100 M0 60 H100" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6" />
          <path d="M20 0 V75 M50 0 V75 M78 0 V75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6" />
          <path
            d="M10 12 L88 8 L94 68 L14 70 Z"
            fill="rgba(16,185,129,0.06)"
            stroke="var(--forest-bright)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
          />
          <path
            d="M22 30 L38 22 L55 40 L63 62 L80 55"
            fill="none"
            stroke="var(--mist)"
            strokeWidth="0.7"
            strokeDasharray="1.6 1.8"
            opacity="0.8"
          />
        </svg>

        {MAP_PINS.map((p, i) => (
          <div
            key={p.label}
            className="absolute -translate-x-1/2 -translate-y-full group"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              <span
                className={`relative flex items-center justify-center rounded-full text-[var(--ink)] shadow-lg ${
                  p.big ? "h-6 w-6 bg-[var(--forest-bright)]" : "h-4 w-4 bg-[var(--mist)]"
                }`}
                style={{ animation: `pk-float 4.5s ease-in-out infinite ${(i % 5) * 0.4}s` }}
              >
                {p.big && (
                  <span
                    className="absolute inset-0 rounded-full bg-[var(--forest-bright)]"
                    style={{ animation: `pk-ping-soft 2.6s ease-out infinite ${(i % 4) * 0.5}s` }}
                  />
                )}
                <Icon name="pin" className={p.big ? "w-3 h-3" : "w-2.5 h-2.5"} />
              </span>
              <span className="mt-1 whitespace-nowrap rounded-md bg-[var(--ink)]/90 border border-white/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {p.label} · ★{p.rating}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 px-1">
        {[
          { k: "42", v: "outlets in view" },
          { k: "3", v: "reps on route" },
          { k: "6", v: "categories filtered" },
        ].map((s) => (
          <div key={s.v} className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
            <div className="font-[family-name:var(--font-mono)] text-sm text-white">{s.k}</div>
            <div className="text-[10px] text-white/45 mt-0.5 leading-tight">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard Mock Components
// ─────────────────────────────────────────────────────────────────────────
function MockStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="font-[family-name:var(--font-mono)] text-lg text-white">{v}</div>
      <div className="text-[10px] text-white/45 mt-0.5 leading-tight">{k}</div>
    </div>
  );
}

function MockBadge({ status }: { status: "approved" | "pending" | "rejected" | "new" }) {
  const styles: Record<string, string> = {
    approved: "bg-[var(--forest-bright)]/15 text-[var(--forest-bright)] border-[var(--forest-bright)]/30",
    pending: "bg-white/[0.06] text-white/60 border-white/15",
    rejected: "bg-white/[0.03] text-white/30 border-white/10 line-through",
    new: "bg-white/10 text-white/80 border-white/20",
  };
  const labels: Record<string, string> = { approved: "Approved", pending: "Pending", rejected: "Rejected", new: "New" };
  return (
    <span className={`font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function DashboardMock({
  kind,
  adminTheme = "dark",
  companyTheme = "dark",
}: {
  kind: "admin" | "scraped" | "company" | "restaurants" | "field";
  adminTheme?: "dark" | "light";
  companyTheme?: "dark" | "light";
}) {
  if (kind === "admin") {
    const src = adminTheme === "light" ? "/images/admin_dashboard_light.png" : "/images/admin_dashboard_dark.png";
    return (
      <div className="relative w-full overflow-hidden">
        <img
          src={src}
          alt={`Super Admin Dashboard UI Snapshot (${adminTheme})`}
          className="w-full h-auto block select-none"
        />
      </div>
    );
  }

  if (kind === "company") {
    const src = companyTheme === "light" ? "/images/company_dashboard_light.png" : "/images/company_dashboard_dark.png";
    return (
      <div className="relative w-full overflow-hidden">
        <img
          src={src}
          alt={`Company Portal Dashboard UI Snapshot (${companyTheme})`}
          className="w-full h-auto block select-none"
        />
      </div>
    );
  }

  if (kind === "field") {
    return (
      <div className="relative w-full overflow-hidden">
        <img
          src="/images/field_app_mockup.jpg"
          alt="Field Team Mobile Workspace Snapshot"
          className="w-full h-auto block select-none"
        />
      </div>
    );
  }

  if (kind === "scraped") {
    const rows = [
      { name: "Bella Vita", area: "PECHS", rep: "A. Khan", rating: "4.0" },
      { name: "Chai Chatt", area: "PECHS", rep: "S. Raza", rating: "4.6" },
      { name: "Cocochan", area: "Clifton", rep: "A. Khan", rating: "4.4" },
    ];
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 rounded-md bg-white/[0.04] border border-white/10 px-3 py-1.5">
          <span className="text-white/30 text-xs">⌕</span>
          <span className="text-[11px] text-white/40">Search restaurants…</span>
        </div>
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-white/[0.04] font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-white/40">
            <span>Name</span>
            <span>Area</span>
            <span>Rep</span>
            <span className="text-right">Rating</span>
          </div>
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-white/5 items-center">
              <span className="text-[11px] text-white/90 font-medium">{r.name}</span>
              <span className="text-[10px] text-white/45">{r.area}</span>
              <span className="text-[10px] text-white/45">{r.rep}</span>
              <span className="text-right font-[family-name:var(--font-mono)] text-[10px] text-[var(--forest-bright)]">★{r.rating}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cols = [
    { label: "New", n: 2 },
    { label: "Contacted", n: 3 },
    { label: "Meeting", n: 1 },
    { label: "Won", n: 2 },
  ];
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-white/90 font-semibold">Field · Today</span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/40">8 assigned</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MockStat k="Assigned" v="8" />
        <MockStat k="Visits today" v="3" />
        <MockStat k="Won" v="2" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {cols.map((c) => (
          <div key={c.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-white/40 mb-2">{c.label}</p>
            <div className="space-y-1.5">
              {Array.from({ length: c.n }).map((_, i) => (
                <div key={i} className="h-6 rounded bg-white/[0.05] border border-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-white/40">Monthly quota</span>
          <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--forest-bright)]">68%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[var(--forest-bright)]" style={{ width: "68%" }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Navigation Component
// ─────────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#product", label: "Product" },
    { href: "#flow", label: "How it works" },
    { href: "#map", label: "Live Map" },
    { href: "#why", label: "Why PakIndex" },
    { href: "#faq", label: "FAQ" },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
    window.history.pushState(null, "", href);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[var(--ink)]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" onClick={(e) => scrollToSection(e, "#top")} className="flex items-center gap-2.5 shrink-0">
          <img src="/brand/logo-icon.png" alt="" className="h-8 w-8 brightness-0 invert" />
          <span className="font-[family-name:var(--font-display)] font-bold tracking-tight text-xl text-white">
            PakIndex
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollToSection(e, l.href)}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/company/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2">
            Log in
          </a>
          <a
            href="#cta"
            onClick={(e) => scrollToSection(e, "#cta")}
            className="text-sm font-semibold bg-[var(--forest-bright)] text-[var(--ink)] rounded-full px-4 py-2 hover:brightness-110 transition shadow-sm"
          >
            Request a demo
          </a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-white p-2 -mr-2"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <Icon name={open ? "close" : "menu"} className="w-6 h-6" />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[var(--ink)] border-t border-white/10 px-5 py-4 flex flex-col gap-1 shadow-2xl">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollToSection(e, l.href)}
              className="text-sm font-medium text-white/80 py-2.5"
            >
              {l.label}
            </a>
          ))}
          <a href="/company/login" onClick={() => setOpen(false)} className="text-sm font-medium text-white/80 py-2.5">
            Log in
          </a>
          <a
            href="#cta"
            onClick={(e) => scrollToSection(e, "#cta")}
            className="mt-2 text-sm font-semibold bg-[var(--forest-bright)] text-[var(--ink)] rounded-full px-4 py-2.5 text-center"
          >
            Request a demo
          </a>
        </div>
      )}
    </header>
  );
}

function BrowserFrame({
  children,
  className = "",
  extraHeaderControls,
}: {
  children: React.ReactNode;
  className?: string;
  extraHeaderControls?: React.ReactNode;
}) {
  return (
    <div
      className={`pk-tilt-card rounded-xl overflow-hidden border border-white/10 bg-[#070B09] shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0C120F] border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--forest-bright)]" />
        </div>
        
        {extraHeaderControls && (
          <div className="flex items-center gap-3">
            {extraHeaderControls}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pk-tilt-card relative mx-auto max-w-[280px] rounded-[38px] overflow-hidden border-[7px] border-[#0C120F] bg-[#070B09] shadow-2xl shadow-black/50 hover:shadow-black/70 transition-all duration-300 ${className}`}
    >
      {/* Phone Notch/Speaker */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-[#0C120F] z-20 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-white/10 mr-1.5" />
        <span className="w-8 h-1 rounded-full bg-white/10" />
      </div>

      <div className="relative pt-6 aspect-[9/16] overflow-hidden">
        {children}
      </div>

    </div>
  );
}

function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-[var(--line)]">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-[var(--ink)] text-[15px] sm:text-base tracking-tight">{q}</span>
        <span
          className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] text-[var(--forest)] transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-10 text-sm leading-relaxed text-[var(--slate)]">{a}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Page Export
// ─────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<(typeof ROLE_TABS)[number]["id"]>("admin");
  const [openFaq, setOpenFaq] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [adminTheme, setAdminTheme] = useState<"dark" | "light">("dark");
  const [companyTheme, setCompanyTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const activeRole = ROLE_TABS.find((r) => r.id === activeTab)!;

  return (
    <main
      id="top"
      className={`${display.variable} ${body.variable} ${mono.variable} font-[family-name:var(--font-body)] bg-[var(--paper)] text-[var(--ink)] antialiased`}
      style={
        {
          "--ink": "#070B09",
          "--paper": "#FFFFFF",
          "--paper-soft": "#F5F7F6",
          "--forest": "#0B5E3A",
          "--forest-deep": "#052C1C",
          "--forest-bright": "#10B981",
          "--mist": "#CBD5E1",
          "--slate": "#475569",
          "--line": "#E2E8F0",
          "--glass": "rgba(255,255,255,0.06)",
        } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          html { scroll-behavior: smooth; }
          section[id], main#top { scroll-margin-top: 84px; }
          @keyframes pk-cell-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          @keyframes pk-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes pk-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes pk-marquee-rev {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
          @keyframes pk-ping-soft {
            0% { transform: scale(0.9); opacity: 0.9; }
            70%, 100% { transform: scale(2.2); opacity: 0; }
          }
          .pk-marquee-track { animation: pk-marquee 28s linear infinite; }
          .pk-marquee-track-rev { animation: pk-marquee-rev 34s linear infinite; }
          .pk-tilt {
            transform: perspective(1200px) rotateX(6deg) rotateY(-8deg) scale(0.98);
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
          }
          .pk-tilt:hover { transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1); }
          .pk-tilt-card {
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            transform-style: preserve-3d;
          }
          .pk-tilt-card:hover { transform: perspective(900px) rotateX(3deg) rotateY(-3deg) translateY(-4px); }
          .pk-glass {
            background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
            backdrop-filter: blur(10px);
          }
          @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .pk-marquee-track, .pk-marquee-track-rev { animation: none; }
            .pk-tilt, .pk-tilt:hover, .pk-tilt-card:hover { transform: none; }
            *[style*="pk-cell-pulse"], *[style*="pk-float"] { animation: none !important; }
          }
        `,
        }}
      />

      <Nav />

      {/* ───────────────────────── HERO SECTION ───────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--ink)] pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 10%, rgba(16,185,129,0.20), transparent), radial-gradient(40% 40% at 10% 90%, rgba(11,94,58,0.25), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] tracking-wider text-[var(--forest-bright)] border border-white/15 rounded-full px-3 py-1.5 mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-bright)]" />
              24°51&apos;N 67°02&apos;E — LIVE OVER KARACHI
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.08] sm:text-6xl sm:leading-[1.06] font-semibold text-white text-balance tracking-tight">
              Pakistan&apos;s HORECA market,
              <br />
              <span className="font-[family-name:var(--font-display)] font-bold text-[var(--forest-bright)]">finally indexed.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] sm:text-lg leading-relaxed text-white/70">
              PakIndex scrapes, verifies and maps every restaurant, cafe and hotel your team needs to
              sell into — then hands your reps a CRM built for the visit, not the spreadsheet.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#cta"
                className="inline-flex items-center gap-2 bg-[var(--forest-bright)] text-[var(--ink)] font-semibold text-sm rounded-full px-6 py-3.5 hover:brightness-110 transition shadow-md"
              >
                Request a demo
                <Icon name="arrow" className="w-4 h-4" />
              </a>
              <a
                href="#flow"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium px-2 py-3.5 transition-colors"
              >
                See how scanning works
              </a>
            </div>

            <dl className="mt-14 grid grid-cols-3 max-w-md gap-6 border-t border-white/10 pt-6">
              <div>
                <dt className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-white">
                  <AnimatedCounter value={139} suffix="+" />
                </dt>
                <dd className="text-xs text-white/50 mt-1 font-medium">businesses indexed</dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-white">
                  <AnimatedCounter value={3} />
                </dt>
                <dd className="text-xs text-white/50 mt-1 font-medium">role-based dashboards</dd>
              </div>
              <div>
                <dt className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-white">24/7</dt>
                <dd className="text-xs text-white/50 mt-1 font-medium">continuous scraping</dd>
              </div>
            </dl>
          </div>

          <Reveal>
            <div className="hidden lg:block relative">
              <div
                className="absolute -inset-6 rounded-[2rem] blur-2xl opacity-60"
                style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.35), transparent)" }}
              />
            </div>
            <div className="pk-tilt relative rounded-2xl border border-white/10 pk-glass p-4 sm:p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4">
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-white/50 tracking-wider">
                  DEEP SCAN · GRID 12×7
                </span>
                <span className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--forest-bright)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-bright)] animate-pulse" />
                  scanning
                </span>
              </div>
              <ScanGrid />
              <p className="mt-5 text-xs text-white/50 leading-relaxed">
                Each cell is a slice of the city. As a scan runs, verified outlets are pulled out and
                dropped straight into your team&apos;s CRM.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Marquee Areas */}
        <div className="relative mt-16 border-t border-white/10 pt-6 overflow-hidden">
          <div className="flex whitespace-nowrap pk-marquee-track">
            {[...AREAS, ...AREAS, ...AREAS].map((a, i) => (
              <span
                key={i}
                className="font-[family-name:var(--font-mono)] text-xs font-medium text-white/40 mx-6 flex items-center gap-2 uppercase tracking-wider"
              >
                <Icon name="pin" className="w-3 h-3 text-[var(--forest-bright)]" />
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── TRUST / METRICS ───────────────────────── */}
      <section className="bg-[var(--paper-soft)] border-b border-[var(--line)] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <h2 className="text-center font-[family-name:var(--font-mono)] text-xs font-semibold tracking-wider text-[var(--slate)] uppercase">
              BUILT FOR THE TEAMS SELLING INTO PAKISTAN&apos;S HORECA MARKET
            </h2>
          </Reveal>
          <Reveal delay={80} className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {[
              "Beverage & FMCG distributors",
              "Food service equipment brands",
              "Ingredient & supply companies",
              "Payments & POS providers",
              "Hospitality staffing agencies",
            ].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--ink)]/80 shadow-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
                {t}
              </span>
            ))}
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {[
              { stat: 3, suffix: "×", label: "faster territory assignment than manual spreadsheets" },
              { stat: 70, suffix: "%", label: "fewer duplicate visits once outlets are de-duplicated" },
              { stat: 24, suffix: "/7", label: "index growth from continuous scraping, not one-time imports" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="pk-tilt-card h-full rounded-2xl bg-[var(--ink)] p-6 text-center shadow-lg border border-white/5">
                  <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--forest-bright)]">
                    <AnimatedCounter value={s.stat} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-xs text-white/70 leading-relaxed font-medium">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── COMPARISON ───────────────────────── */}
      <section className="bg-[var(--paper)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
              THE OLD WAY
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 max-w-2xl text-balance font-bold tracking-tight">
              Most sales teams still find restaurants the way they did ten years ago.
            </h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 gap-px bg-[var(--line)] rounded-2xl overflow-hidden border border-[var(--line)] shadow-sm">
            <Reveal className="bg-[var(--paper)] p-8 sm:p-10">
              <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--slate)] uppercase">
                WITHOUT PAKINDEX
              </span>
              <ul className="mt-6 space-y-5">
                {[
                  "Outlets found by memory, referrals or driving around",
                  "Leads scattered across notebooks and chat threads",
                  "No shared record of who visited what, or when",
                  "Owners find out about a dead pipeline weeks too late",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm font-medium text-[var(--slate)]">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--slate)]/40 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120} className="bg-[var(--ink)] p-8 sm:p-10">
              <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest-bright)] uppercase">
                WITH PAKINDEX
              </span>
              <ul className="mt-6 space-y-5">
                {[
                  "A verified, growing index of outlets by city and area",
                  "One CRM pipeline every rep and manager can see",
                  "Every visit, note and status change logged automatically",
                  "Stale-lead alerts the moment a deal goes quiet",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm font-medium text-white/90">
                    <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--forest-bright)]/20 shrink-0">
                      <Icon name="check" className="w-2.5 h-2.5 text-[var(--forest-bright)]" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────────────── THREE CARDS ───────────────────────── */}
      <section className="bg-[var(--paper-soft)] py-24 sm:py-32 border-y border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
              ONE SYSTEM, THREE CARDS
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 text-balance font-bold tracking-tight">
              Index cards, not org charts.
            </h2>
            <p className="mt-4 text-[15px] font-medium text-[var(--slate)] leading-relaxed">
              Every business in PakIndex moves through exactly three hands — the admin who verifies it,
              the company who claims it, and the rep who closes it.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {[
              { icon: "shield", tag: "01 · Super Admin", title: "Curates the index", text: "Runs the scrapes, screens every result, and keeps the master database clean.", color: "var(--ink)" },
              { icon: "building", tag: "02 · Company", title: "Owns the territory", text: "Claims outlets by area, staffs a team, and watches the pipeline in real time.", color: "var(--forest)" },
              { icon: "route", tag: "03 · Field Employee", title: "Closes on the ground", text: "Works the map, visits the outlet, and updates the deal on the spot.", color: "var(--forest-deep)" },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 100}>
                <div className="group relative h-full rounded-2xl bg-[var(--paper)] border border-[var(--line)] p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white mb-6 shadow-sm"
                    style={{ backgroundColor: c.color }}
                  >
                    <Icon name={c.icon} className="w-5 h-5" />
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-xs font-semibold tracking-wider text-[var(--slate)] uppercase">
                    {c.tag}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-xl mt-2 mb-2 font-bold tracking-tight">{c.title}</h3>
                  <p className="text-sm font-medium text-[var(--slate)] leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── PRODUCT SHOWCASE ───────────────────────── */}
      <section id="product" className="bg-[var(--paper)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
              INSIDE THE PRODUCT
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 text-balance font-bold tracking-tight">
              One database. Three screens, each built for its job.
            </h2>
          </Reveal>

          <div className="mt-10 flex flex-wrap gap-2">
            {ROLE_TABS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold border transition-all ${
                  activeTab === r.id
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm"
                    : "bg-transparent text-[var(--slate)] border-[var(--line)] hover:border-[var(--ink)]/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div key={activeRole.id} className="mt-10 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
            <Reveal>
              <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
                {activeRole.eyebrow}
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl leading-tight mt-3 mb-4 text-balance font-bold tracking-tight">
                {activeRole.title}
              </h3>
              <p className="text-[15px] font-medium text-[var(--slate)] leading-relaxed mb-6">{activeRole.body}</p>
              <ul className="space-y-3">
                {activeRole.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm font-medium text-[var(--ink)]">
                    <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--forest)]/10 shrink-0">
                      <Icon name="check" className="w-2.5 h-2.5 text-[var(--forest)]" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100} className="space-y-6">
              {activeRole.id === "field" ? (
                <PhoneFrame>
                  <DashboardMock kind={activeRole.mock} />
                </PhoneFrame>
              ) : (
                <BrowserFrame
                  extraHeaderControls={
                    activeRole.id === "admin" ? (
                      <div className="flex items-center bg-white/[0.04] p-0.5 rounded-md border border-white/10">
                        <button
                          onClick={() => setAdminTheme("dark")}
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-sm tracking-wide transition-all uppercase ${
                            adminTheme === "dark"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          Dark
                        </button>
                        <button
                          onClick={() => setAdminTheme("light")}
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-sm tracking-wide transition-all uppercase ${
                            adminTheme === "light"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          Light
                        </button>
                      </div>
                    ) : activeRole.id === "company" ? (
                      <div className="flex items-center bg-white/[0.04] p-0.5 rounded-md border border-white/10">
                        <button
                          onClick={() => setCompanyTheme("dark")}
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-sm tracking-wide transition-all uppercase ${
                            companyTheme === "dark"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          Dark
                        </button>
                        <button
                          onClick={() => setCompanyTheme("light")}
                          className={`px-2.5 py-0.5 text-[9px] font-bold rounded-sm tracking-wide transition-all uppercase ${
                            companyTheme === "light"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          Light
                        </button>
                      </div>
                    ) : undefined
                  }
                >
                  <DashboardMock kind={activeRole.mock} adminTheme={adminTheme} companyTheme={companyTheme} />
                </BrowserFrame>
              )}
              {activeRole.secondary && (
                <div className="grid sm:grid-cols-[1.2fr_1fr] gap-5 items-start bg-[var(--paper-soft)] rounded-xl p-5 border border-[var(--line)]">
                  <BrowserFrame>
                    <DashboardMock kind={activeRole.secondary.mock} />
                  </BrowserFrame>
                  <p className="text-xs font-medium text-[var(--slate)] leading-relaxed sm:pt-1">
                    {activeRole.secondary.caption}
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────────────── LIVE MAP ───────────────────────── */}
      <section id="map" className="relative overflow-hidden bg-[var(--ink)] py-24 sm:py-32">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(45% 45% at 15% 20%, rgba(16,185,129,0.25), transparent), radial-gradient(35% 35% at 90% 80%, rgba(11,94,58,0.20), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
          <Reveal>
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest-bright)] uppercase">
              HORECA MAP
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 text-white text-balance font-bold tracking-tight">
              Territory isn&apos;t a spreadsheet tab — it&apos;s a map your team actually opens.
            </h2>
            <p className="mt-5 text-[15px] font-medium text-white/70 leading-relaxed max-w-lg">
              Every approved outlet lands on a clustered, filterable map scoped to each role — the
              full city for admins, an assigned territory for companies, and today&apos;s route for a
              rep in the field.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Marker clustering that stays readable at city scale",
                "Category & area filters, saved per company",
                "Tap a pin to add to CRM or assign an employee on the spot",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm font-medium text-white/80">
                  <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--forest-bright)]/20 shrink-0">
                    <Icon name="check" className="w-2.5 h-2.5 text-[var(--forest-bright)]" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <MapPreview />
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── WORKFLOW ───────────────────────── */}
      <section id="flow" className="bg-[var(--ink)] py-24 sm:py-32 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest-bright)] uppercase">
              THE COMPLETE LOOP
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 text-white text-balance font-bold tracking-tight">
              From an empty map to a closed deal.
            </h2>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {FLOW_STEPS.map((s, i) => (
              <Reveal key={s.n} delay={(i % 3) * 90} className="bg-[var(--ink)] p-7 sm:p-8">
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-[family-name:var(--font-display)] font-bold text-3xl text-white/20">
                    {s.n}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--forest-bright)] font-medium text-right uppercase tracking-wider">
                    {s.area}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{s.title}</h3>
                <p className="text-sm font-medium text-white/60 leading-relaxed">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FEATURES ───────────────────────── */}
      <section id="why" className="bg-[var(--paper)] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
              WHY PAKINDEX
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-[2.6rem] leading-tight mt-3 text-balance font-bold tracking-tight">
              Most CRMs assume the data already exists.
            </h2>
            <p className="mt-4 text-[15px] font-medium text-[var(--slate)] leading-relaxed">
              PakIndex builds the index first — then puts a CRM on top of it, instead of the other way
              around.
            </p>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90}>
                <div className="h-full rounded-2xl border border-[var(--line)] p-7 hover:border-[var(--forest)]/40 transition-colors bg-[var(--paper)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--forest)]/10 text-[var(--forest)] mb-5">
                    <Icon name={f.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[var(--ink)] mb-2 text-base tracking-tight">{f.title}</h3>
                  <p className="text-sm font-medium text-[var(--slate)] leading-relaxed">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section id="faq" className="bg-[var(--paper-soft)] py-24 sm:py-32 border-t border-[var(--line)]">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-wider text-[var(--forest)] uppercase">
              QUESTIONS
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl leading-tight mt-3 font-bold tracking-tight">
              Before you ask
            </h2>
          </Reveal>

          <Reveal delay={100} className="mt-10">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                open={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── TESTIMONIAL ───────────────────────── */}
      <section className="bg-[var(--paper)] py-24 sm:py-28 border-t border-[var(--line)]">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <div className="pk-tilt-card relative rounded-3xl bg-[var(--paper-soft)] border border-[var(--line)] p-9 sm:p-12 text-center shadow-lg">
              <span className="font-[family-name:var(--font-display)] font-bold text-5xl text-[var(--forest)]/20 leading-none">
                &ldquo;
              </span>
              <p className="font-[family-name:var(--font-display)] text-xl sm:text-2xl leading-relaxed text-[var(--ink)] text-balance -mt-3 font-semibold tracking-tight">
                Before PakIndex our reps mapped territory from memory. Now every outlet in our
                patch is on one map, assigned, and tracked — onboarding a new rep takes a day, not
                a month.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest)] text-white text-xs font-semibold">
                  SM
                </span>
                <div className="text-left">
                  <p className="text-sm font-bold text-[var(--ink)]">Sales Manager</p>
                  <p className="text-xs font-medium text-[var(--slate)]">Beverage distribution company, Karachi</p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              { icon: "shield", label: "Role-based data access" },
              { icon: "database", label: "Verified, de-duplicated records" },
              { icon: "sync", label: "Dedicated onboarding support" },
            ].map((b) => (
              <span key={b.label} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--slate)]">
                <Icon name={b.icon} className="w-4 h-4 text-[var(--forest)]" />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── CALL TO ACTION ───────────────────────── */}
      <section id="cta" className="relative overflow-hidden bg-[var(--ink)] py-24 sm:py-32">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(50% 60% at 50% 0%, rgba(16,185,129,0.22), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
          <Reveal>
            <img src="/brand/logo-icon.png" alt="" className="h-10 w-10 mx-auto mb-8 brightness-0 invert" />
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl leading-tight text-white text-balance font-bold tracking-tight">
              Stop guessing where your next sale is.
            </h2>
            <p className="mt-5 text-white/70 text-[15px] sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
              Bring your team a verified index, a live map, and a pipeline built for the visit —
              not the spreadsheet.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:admin@pakindex.com"
                className="inline-flex items-center gap-2 bg-[var(--forest-bright)] text-[var(--ink)] font-semibold text-sm rounded-full px-7 py-3.5 hover:brightness-110 transition shadow-md"
              >
                Request a demo
                <Icon name="arrow" className="w-4 h-4" />
              </a>
              <a
                href="#product"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold border border-white/20 rounded-full px-7 py-3.5 transition-colors"
              >
                Explore the product
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="bg-[var(--ink)] border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/brand/logo-icon.png" alt="" className="h-6 w-6 brightness-0 invert" />
            <span className="font-[family-name:var(--font-display)] text-white font-bold text-base tracking-tight">PakIndex</span>
          </div>
          <p className="font-[family-name:var(--font-mono)] text-xs text-white/50 text-center">
            www.pakindex.com · admin@pakindex.com
          </p>
          <p className="text-xs text-white/40 font-medium">
            © {hasMounted ? new Date().getFullYear() : "2026"} PakIndex. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}