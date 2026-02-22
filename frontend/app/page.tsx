"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  Compass,
  Globe,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Video,
  X,
} from "lucide-react";

type ThemeMode = "light" | "dark";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Safety", href: "#safety" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const quickStats = [
  { value: "24M+", label: "Messages every week", icon: MessageSquare },
  { value: "190ms", label: "Median voice latency", icon: Mic },
  { value: "99.95%", label: "Monthly uptime target", icon: ShieldCheck },
];

const coreFeatures = [
  {
    title: "Conversation-first channels",
    description: "Organize text, voice, and video into clean spaces people understand immediately.",
    icon: MessageSquare,
  },
  {
    title: "Reliable voice rooms",
    description: "Crisp voice and screen sharing backed by your LiveKit infrastructure.",
    icon: Video,
  },
  {
    title: "Role-aware moderation",
    description: "Permissions, onboarding checks, and audit trails built for growing teams.",
    icon: ShieldCheck,
  },
  {
    title: "Smart discovery",
    description: "Interest matching helps users find relevant communities and channels faster.",
    icon: Compass,
  },
  {
    title: "Presence and activity",
    description: "Live status signals keep members aware of who is available and active.",
    icon: Activity,
  },
  {
    title: "Actionable analytics",
    description: "Track engagement, growth, and health with practical weekly reporting.",
    icon: BarChart3,
  },
];

const workflowSteps = [
  {
    title: "Launch a server in minutes",
    description: "Use templates and starter roles so your structure is ready on day one.",
  },
  {
    title: "Onboard members safely",
    description: "Enable screening rules and automod before inviting large audiences.",
  },
  {
    title: "Scale with confidence",
    description: "Use analytics, discovery, and moderation insights to improve retention.",
  },
];

const moderationItems = [
  "Automod filters for spam, abuse, and invite flooding",
  "Action logs for kicks, bans, and role updates",
  "Member screening with approval flows",
  "Channel-level and role-level access controls",
  "Server health insights and trend monitoring",
  "Template-based governance for new communities",
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    highlight: false,
    perks: ["Core chat + voice", "Basic moderation", "Community templates", "Email support"],
  },
  {
    name: "Growth",
    price: "$8",
    period: "/month",
    highlight: true,
    perks: ["HD streaming", "Advanced moderation", "AI summaries", "Priority support"],
  },
  {
    name: "Scale",
    price: "$19",
    period: "/month",
    highlight: false,
    perks: ["Large upload limits", "Analytics exports", "Team admin roles", "Early feature access"],
  },
];

const faqs = [
  {
    q: "Does Qubily work fully in the browser?",
    a: "Yes. Members can join servers, chat, and use voice/video directly from the web client.",
  },
  {
    q: "Can this handle large communities?",
    a: "Yes. The platform includes moderation controls, role permissions, analytics, and scalable backend services.",
  },
  {
    q: "How quickly can I launch?",
    a: "Most teams can launch a production-ready community setup in less than an hour using templates.",
  },
  {
    q: "What tools are available for moderators?",
    a: "You get automod rules, audit logs, member screening, and channel-level control by role.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mb-12 text-center" : "mb-10"}>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl [font-family:var(--font-geist-sans)]">
        {title}
      </h2>
      {subtitle ? (
        <p className={`${center ? "mx-auto" : ""} mt-4 max-w-3xl text-[var(--text-soft)]`}>{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLight = theme === "light";

  return (
    <div
      className="min-h-screen overflow-x-clip transition-colors duration-300 [font-family:var(--font-geist-sans)]"
      style={
        {
          background: isLight
            ? "linear-gradient(180deg,#f8f7fa 0%,#f0edf4 40%,#faf9fc 100%)"
            : "linear-gradient(180deg,#0a0a0c 0%,#111114 40%,#0a0a0c 100%)",
          color: isLight ? "#1a1820" : "#eceaf2",
          ["--card" as string]: isLight ? "rgba(255,255,255,0.88)" : "rgba(24,24,28,0.72)",
          ["--card-border" as string]: isLight ? "rgba(147,112,219,0.18)" : "rgba(147,112,219,0.28)",
          ["--text-soft" as string]: isLight ? "#4a465a" : "rgba(224,222,240,0.82)",
          ["--muted" as string]: isLight ? "#7a6b97" : "#a291de",
          ["--pill" as string]: isLight ? "rgba(147,112,219,0.1)" : "rgba(147,112,219,0.16)",
          ["--accent" as string]: isLight ? "#9333ea" : "#a855f7",
          ["--accent-2" as string]: isLight ? "#a855f7" : "#c084fc",
          ["--accent-soft" as string]: isLight ? "rgba(147,112,219,0.26)" : "rgba(168,85,247,0.34)",
          ["--accent-strong" as string]: isLight ? "#7e22ce" : "#9333ea",
          ["--warm" as string]: isLight ? "#db2777" : "#f472b6",
          ["--cta-grad" as string]: isLight
            ? "linear-gradient(135deg,#7e22ce 0%,#a855f7 100%)"
            : "linear-gradient(135deg,#9333ea 0%,#c084fc 100%)",
          ["--header-bg" as string]: isLight ? "rgba(245,243,248,0.85)" : "rgba(17,17,20,0.82)",
          ["--header-border" as string]: isLight ? "rgba(147,112,219,0.18)" : "rgba(147,112,219,0.25)",
          ["--header-shadow" as string]: isLight ? "0 10px 28px rgba(30,20,50,0.08)" : "0 10px 30px rgba(7,7,10,0.45)",
          ["--danger" as string]: isLight ? "#dc2626" : "#ef4444",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8%] top-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl animate-float-soft" />
        <div className="absolute right-[-5%] top-16 h-72 w-72 rounded-full bg-fuchsia-500/16 blur-3xl animate-float-soft [animation-delay:0.9s]" />
        <div className="absolute bottom-[-18%] left-1/3 h-[26rem] w-[26rem] rounded-full bg-pink-500/10 blur-[100px] animate-gradient-drift" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.2),transparent_32%)]" />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? "border-b py-3 backdrop-blur-xl" : "py-5"
        }`}
        style={
          isScrolled
            ? {
                background: "var(--header-bg)",
                borderColor: "var(--header-border)",
                boxShadow: "var(--header-shadow)",
              }
            : undefined
        }
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Qubily logo" width={36} height={36} className="rounded-md" />
            <span className="text-lg font-semibold tracking-tight [font-family:var(--font-geist-sans)]">Qubily</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-[var(--text-soft)] transition hover:text-[var(--accent)]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--accent-soft)]"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />} {isLight ? "Dark" : "Light"}
            </button>
            <Link
              href="/login"
              className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
              style={{ background: "var(--cta-grad)" }}
            >
              Get Started
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            className="rounded-md border border-[var(--card-border)] bg-[var(--card)] p-2 lg:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[var(--card-border)] bg-[var(--card)] px-4 py-5 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm text-[var(--text-soft)] transition hover:text-[var(--accent)]"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
                  className="rounded-full border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--text-soft)]"
                >
                  {isLight ? "Dark Theme" : "Light Theme"}
                </button>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full border border-[var(--card-border)] px-3 py-2 text-center text-sm text-[var(--text-soft)]"
                >
                  Login
                </Link>
              </div>
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="mt-1 rounded-full py-2.5 text-center text-sm font-semibold text-white"
                style={{ background: "var(--cta-grad)" }}
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-36 sm:px-6 md:pt-44 md:pb-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <span className="reveal-up inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--pill)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <Sparkles size={13} /> Built for high-retention communities
              </span>

              <h1 className="reveal-up mt-6 text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl [animation-delay:80ms] [font-family:var(--font-geist-sans)]">
                A cleaner way to chat, collaborate, and grow your community.
              </h1>

              <p className="reveal-up mt-5 max-w-xl text-base leading-relaxed text-[var(--text-soft)] sm:text-lg [animation-delay:160ms]">
                Qubily combines channel messaging, voice rooms, moderation, and discovery into one product teams can manage without complexity.
              </p>

              <div className="reveal-up mt-8 flex flex-col gap-3 sm:flex-row [animation-delay:230ms]">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-105"
                  style={{ background: "var(--cta-grad)" }}
                >
                  Start Free <ArrowRight size={15} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-6 py-3 text-[var(--text-soft)] transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
                >
                  Open in Browser
                </Link>
              </div>

              <div className="reveal-up mt-7 flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)] [animation-delay:290ms]">
                <span className="rounded-full bg-[var(--pill)] px-3 py-1 font-semibold text-[var(--muted)]">No installation needed</span>
                <span className="rounded-full bg-[var(--pill)] px-3 py-1 font-semibold text-[var(--muted)]">LiveKit voice + video</span>
                <span className="rounded-full bg-[var(--pill)] px-3 py-1 font-semibold text-[var(--muted)]">Redis + Kafka infrastructure</span>
              </div>
            </div>

            <div className="reveal-up relative [animation-delay:180ms]">
              <div className="absolute -left-4 top-10 h-16 w-16 rounded-2xl bg-purple-500/40 blur-sm" />
              <div className="absolute -right-5 bottom-8 h-12 w-12 rounded-full border-4 border-[var(--accent-soft)]" />

              <article className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-2xl backdrop-blur-sm">
                <div className="grid grid-cols-[0.34fr_0.66fr] gap-3">
                  <aside className="rounded-2xl border border-[var(--card-border)] bg-[var(--pill)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Channels</p>
                    <div className="mt-3 space-y-2 text-xs text-[var(--text-soft)]">
                      <p className="rounded-md bg-[var(--card)] px-2 py-1 text-[var(--accent)]"># announcements</p>
                      <p># product-launch</p>
                      <p># support</p>
                      <p># events</p>
                    </div>
                  </aside>

                  <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--accent)]"># product-launch</p>
                      <span className="rounded-full bg-[var(--pill)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">42 online</span>
                    </div>
                    <div className="space-y-2 text-xs text-[var(--text-soft)]">
                      <p className="rounded-lg bg-[var(--pill)] p-2">Weekly update is live. Check rollout notes.</p>
                      <p className="rounded-lg bg-[var(--pill)] p-2">Voice room opens in 10 minutes for Q&A.</p>
                      <div className="rounded-lg bg-gradient-to-r from-pink-500/20 via-fuchsia-400/10 to-transparent p-2 ring-1 ring-pink-400/30">
                        <p className="font-semibold text-[var(--warm)]">Moderator insight</p>
                        <p className="mt-1">Spam pattern detected and auto-filtered.</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                      <button className="rounded-md border border-[var(--card-border)] bg-[var(--card)] py-2 transition hover:-translate-y-0.5">
                        <Mic size={13} className="mx-auto" />
                      </button>
                      <button className="rounded-md border border-[var(--card-border)] bg-[var(--card)] py-2 transition hover:-translate-y-0.5">
                        <Video size={13} className="mx-auto" />
                      </button>
                      <button className="rounded-md py-2 text-white transition hover:-translate-y-0.5" style={{ backgroundColor: "var(--danger)" }}>
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {quickStats.map((item, idx) => (
              <article
                key={item.label}
                className="reveal-up flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-soft)] hover:shadow-lg"
                style={{ animationDelay: `${320 + idx * 80}ms` }}
              >
                <item.icon size={20} className="text-[var(--accent)]" />
                <div>
                  <p className="text-2xl font-semibold text-[var(--accent)]">{item.value}</p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{item.label}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-28 border-y border-[var(--card-border)] bg-[var(--pill)]/45">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <SectionHeading
              eyebrow="Features"
              title="Focused tools that keep communities active"
              subtitle="Everything is organized around clarity, speed, and maintainable moderation workflows."
              center
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coreFeatures.map((feature, idx) => (
                <article
                  key={feature.title}
                  className="reveal-up rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-soft)] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  <div className="inline-flex rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/15 p-2 ring-1 ring-white/20">
                    <feature.icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-28 border-b border-[var(--card-border)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <SectionHeading
              eyebrow="Workflow"
              title="A launch path your team can follow"
              subtitle="Move from setup to scale with a clear operating model."
            />

            <div className="grid gap-4 md:grid-cols-3">
              {workflowSteps.map((step, idx) => (
                <article
                  key={step.title}
                  className="reveal-up rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pill)] text-sm font-semibold text-[var(--accent)]">
                    {idx + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="scroll-mt-28 border-b border-[var(--card-border)] bg-[var(--pill)]/45">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <article className="reveal-up rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 md:p-8">
              <SectionHeading
                eyebrow="Safety"
                title="Moderation designed for real operations"
                subtitle="Prevent chaos early with controls your moderator team can trust."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {moderationItems.map((item, idx) => (
                  <div
                    key={item}
                    className="reveal-up rounded-xl border border-[var(--card-border)] bg-[var(--pill)] px-3 py-2 text-sm text-[var(--text-soft)]"
                    style={{ animationDelay: `${120 + idx * 60}ms` }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="reveal-up rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 md:p-8 [animation-delay:120ms]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Discovery</p>
              <h3 className="mt-3 text-2xl font-semibold [font-family:var(--font-geist-sans)]">Help users find the right place faster</h3>

              <ul className="mt-6 space-y-3 text-sm text-[var(--text-soft)]">
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 text-[var(--accent)]" />
                  Interest-first recommendations for better first-session retention
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 text-[var(--accent)]" />
                  Smarter search ranking with activity and profile signals
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 text-[var(--accent)]" />
                  Curated discovery cards for events, creators, and learning communities
                </li>
              </ul>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--pill)] p-3">
                  <p className="text-xs text-[var(--muted)]">Join conversion</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--accent)]">+31%</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--pill)] p-3">
                  <p className="text-xs text-[var(--muted)]">Week-1 retention</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--accent)]">+18%</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple plans that scale with your server"
            subtitle="Start free, upgrade only when your workflows need more depth."
            center
          />

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, idx) => (
              <article
                key={plan.name}
                className={`reveal-up rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? "border-[var(--accent-soft)] bg-[var(--pill)] shadow-lg shadow-purple-500/10"
                    : "border-[var(--card-border)] bg-[var(--card)]"
                }`}
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.highlight ? (
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent-strong)" }}>
                      Best Value
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-3xl font-semibold">
                  {plan.price}
                  <span className="text-base font-normal text-[var(--text-soft)]"> {plan.period}</span>
                </p>

                <ul className="mt-5 space-y-2">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-[var(--text-soft)]">
                      <Check size={14} className="mt-1 text-[var(--accent)]" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-7 w-full rounded-full py-3 text-sm font-semibold transition hover:brightness-105 ${
                    plan.highlight ? "text-white" : "border border-[var(--card-border)]"
                  }`}
                  style={plan.highlight ? { background: "var(--cta-grad)" } : undefined}
                >
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 border-y border-[var(--card-border)] bg-[var(--pill)]/45">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions before launch"
              subtitle="Short answers for teams evaluating Qubily."
            />

            <div className="space-y-3">
              {faqs.map((item, idx) => (
                <details
                  key={item.q}
                  className="reveal-up rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="support" className="border-t border-[var(--card-border)] bg-[var(--card)]/70 px-4 pb-8 pt-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Ready to launch</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl [font-family:var(--font-geist-sans)]">
              Build a community your members actually return to
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--text-soft)]">
              Move from setup to daily engagement with cleaner channels, stronger moderation, and better discovery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--cta-grad)" }}
              >
                Create Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] px-5 py-2.5 text-sm text-[var(--text-soft)]"
              >
                Open App
              </Link>
            </div>
          </div>

          <div className="grid gap-8 border-b border-[var(--card-border)] pb-10 md:grid-cols-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/logo.png" alt="Qubily logo" width={32} height={32} className="rounded-md" />
                <span className="text-lg font-semibold [font-family:var(--font-geist-sans)]">Qubily</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm text-[var(--text-soft)]">
                Community infrastructure for teams that care about quality conversations.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Product</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">
                <a href="#features" className="block hover:text-[var(--accent)]">Features</a>
                <a href="#pricing" className="block hover:text-[var(--accent)]">Pricing</a>
                <a href="#faq" className="block hover:text-[var(--accent)]">FAQ</a>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Explore</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">
                <a href="#workflow" className="inline-flex items-center gap-1 hover:text-[var(--accent)]"><Search size={13} /> Workflow</a>
                <a href="#safety" className="inline-flex items-center gap-1 hover:text-[var(--accent)]"><ShieldCheck size={13} /> Safety</a>
                <a href="#features" className="inline-flex items-center gap-1 hover:text-[var(--accent)]"><Globe size={13} /> Discovery</a>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Account</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">
                <Link href="/signup" className="block hover:text-[var(--accent)]">Create Account</Link>
                <Link href="/login" className="block hover:text-[var(--accent)]">Sign In</Link>
                <Link href="/me/profile" className="block hover:text-[var(--accent)]">Profile</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 text-xs text-[var(--text-soft)] sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 Qubily. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <a href="#support" className="hover:text-[var(--accent)]">Privacy</a>
              <a href="#support" className="hover:text-[var(--accent)]">Terms</a>
              <a href="#support" className="hover:text-[var(--accent)]">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
