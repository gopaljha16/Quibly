"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  FileUp,
  LayoutTemplate,
  MessageCircle,
  Download,
  Menu,
  Mic,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Moderation", href: "#moderation" },
  { label: "Safety", href: "#safety" },
  { label: "Discovery", href: "#discover" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "#support" },
];

const features = [
  {
    title: "Organized Channels",
    description:
      "Keep conversations clear with text, voice, and announcement channels split by topic.",
  },
  {
    title: "Always-On Voice",
    description:
      "Drop in and out instantly. Low-latency audio keeps calls smooth for teams and friends.",
  },
  {
    title: "Smart AI Assist",
    description:
      "Summaries, moderation suggestions, and channel highlights help communities stay focused.",
  },
  {
    title: "Role-Based Control",
    description:
      "Granular permissions and role presets make server management simple at any size.",
  },
];

const stats = [
  { value: "120K+", label: "Active communities" },
  { value: "8.5M", label: "Messages delivered daily" },
  { value: "99.9%", label: "Service uptime" },
];

const communicationFeatures = [
  {
    title: "Real-time messaging",
    description: "Fast Socket.IO chat with channel streams and instant updates.",
    icon: MessageCircle,
  },
  {
    title: "Direct messages and friends",
    description: "Private conversations, friend requests, and easy social workflows.",
    icon: Users,
  },
  {
    title: "Voice and video calls",
    description: "LiveKit-powered channels for reliable voice rooms and video sessions.",
    icon: Video,
  },
  {
    title: "Presence and activity",
    description: "Custom status, activity indicators, and online presence sync.",
    icon: Activity,
  },
  {
    title: "File uploads and previews",
    description: "Cloud media uploads with rich link previews and message reactions.",
    icon: FileUp,
  },
  {
    title: "Server and channel controls",
    description: "Role-based access and structured spaces for growing teams.",
    icon: Server,
  },
];

const moderationFeatures = [
  "Auto moderation and anti-spam rules",
  "Audit logs for server actions",
  "Member screening and onboarding questions",
  "Welcome screens for new users",
  "Role permissions and access policies",
  "Server analytics for growth and engagement",
  "Server templates for quick setup",
  "Interest-based discovery and search",
];

const plans = [
  {
    name: "Basic",
    price: "$2.99",
    period: "/month",
    highlight: false,
    perks: [
      "Global emojis",
      "300 MB file uploads",
      "Custom profile styling",
      "Priority support queue",
    ],
  },
  {
    name: "Ultra",
    price: "$9.99",
    period: "/month",
    highlight: true,
    perks: [
      "4K stream quality",
      "5 GB file uploads",
      "AI assistant boost",
      "2 server boosts included",
      "Early access features",
    ],
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mb-10 text-center" : "mb-8"}>
      <p className="text-xs uppercase tracking-[0.18em] text-violet-100/85">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl [font-family:var(--font-geist-sans)]">{title}</h2>
      {description ? (
        <p className={`${center ? "mx-auto" : ""} mt-4 max-w-3xl text-white/70`}>{description}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0b11] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(139,92,246,0.28),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(148,163,184,0.18),transparent_40%),linear-gradient(180deg,#0b0b11_0%,#090913_65%,#06060d_100%)] animate-gradient-drift" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="absolute left-[6%] top-24 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl animate-float-soft" />
        <div className="absolute bottom-20 right-[8%] h-44 w-44 rounded-full bg-slate-300/10 blur-3xl animate-float-soft [animation-delay:1.4s]" />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-white/10 bg-[#0d0d16]/85 py-3 backdrop-blur-xl"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Qubily logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="font-[700] tracking-wide text-white [font-family:var(--font-geist-sans)]">
              Qubily
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/80 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition hover:text-violet-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/90 transition hover:border-violet-300/60 hover:text-violet-200"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-violet-300 px-5 py-2 text-sm font-semibold text-[#1d1430] transition hover:bg-violet-200"
            >
              Get Started
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            className="rounded-md border border-white/15 p-2 text-white lg:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 bg-[#0d0d16]/95 px-4 py-5 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm text-white/85 transition hover:text-violet-300"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 rounded-full border border-white/15 px-4 py-2 text-center text-sm text-white/90"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 rounded-full bg-violet-300 px-4 py-2 text-center text-sm font-semibold text-[#1d1430]"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-36 text-center sm:px-6 md:pb-28 md:pt-44">
          <span className="reveal-up mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-300/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-violet-100">
            <Sparkles size={14} /> Community-first communication
          </span>
          <h1 className="reveal-up max-w-4xl text-balance text-4xl font-semibold leading-tight text-white sm:text-6xl md:text-7xl [font-family:var(--font-geist-sans)] [animation-delay:80ms]">
            Build your digital home with a landing experience that feels premium.
          </h1>
          <p className="reveal-up mt-6 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg [animation-delay:140ms]">
            Qubily gives your server a faster, cleaner place to chat, stream, and collaborate with AI-powered tools built in.
          </p>
          <div className="reveal-up mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row [animation-delay:220ms]">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-300 px-7 py-3 font-semibold text-[#1d1430] transition hover:bg-violet-200 sm:w-auto"
            >
              Start Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-white/90 transition hover:border-white/35 hover:bg-white/10 sm:w-auto"
            >
              Open in Browser
            </Link>
          </div>

          <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
            {stats.map((item, idx) => (
              <article
                key={item.label}
                className="reveal-up rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-[0_12px_48px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-violet-200/45 hover:bg-white/10"
                style={{ animationDelay: `${260 + idx * 70}ms` }}
              >
                <p className="text-2xl font-semibold text-violet-200">{item.value}</p>
                <p className="mt-1 text-sm text-white/70">{item.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <SectionHeader
              eyebrow="Core features"
              title="Everything your Qubily community needs in one place"
              description="The platform already supports messaging, calls, discovery, moderation, profiles, and rich collaboration flows."
              center
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communicationFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="reveal-up rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-200/45 hover:bg-white/10"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <Icon size={18} className="text-violet-200" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-7xl border-b border-white/10 px-4 py-16 sm:px-6 md:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
            <div className="reveal-up rounded-3xl border border-white/10 bg-[#12121d]/90 p-5 shadow-2xl">
              <div className="rounded-2xl border border-white/10 bg-[#181827] p-5">
                <div className="mb-5 flex items-center justify-between text-xs text-white/60">
                  <span># dev-room</span>
                  <span>14 online</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-violet-100">AI Summary</p>
                    <p className="mt-1 text-white/70">8 new updates were posted since your last visit.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-200">Voice Quality</p>
                    <p className="mt-1 text-white/70">Noise reduction active for all participants.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button className="rounded-lg border border-white/15 bg-white/5 py-2 text-xs text-white/85">
                      <Mic size={14} className="mx-auto" />
                    </button>
                    <button className="rounded-lg border border-white/15 bg-white/5 py-2 text-xs text-white/85">
                      <Video size={14} className="mx-auto" />
                    </button>
                    <button className="rounded-lg border border-red-300/50 bg-red-300/20 py-2 text-xs text-red-100">
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal-up [animation-delay:120ms]">
              <SectionHeader
                eyebrow="Product"
                title="Clean interface. Fast interactions. Better community flow."
                description="We simplified the landing experience and the in-app journey so new members understand the value in seconds."
              />
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {features.map((feature, idx) => (
                  <article
                    key={feature.title}
                    className="reveal-up rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-200/35 hover:bg-white/10"
                    style={{ animationDelay: `${240 + idx * 60}ms` }}
                  >
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="moderation" className="border-b border-white/10 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="reveal-up rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <SectionHeader
                eyebrow="Admin toolkit"
                title="Built-in moderation and server operations"
                description="Your backend already ships with strong community management features. This section makes that value visible on the landing page."
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {moderationFeatures.map((item, idx) => (
                  <div key={item} className="reveal-up rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85" style={{ animationDelay: `${140 + idx * 50}ms` }}>
                    {item}
                  </div>
                ))}
              </div>
            </article>
            <article className="reveal-up rounded-3xl border border-white/10 bg-gradient-to-b from-violet-300/15 to-transparent p-6 md:p-8 [animation-delay:120ms]">
              <p className="text-xs uppercase tracking-[0.18em] text-violet-100/85">Scale-ready stack</p>
              <h3 className="mt-3 text-2xl font-semibold [font-family:var(--font-geist-sans)]">Production architecture</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 shrink-0 text-violet-200" />
                  Multi-server backend with Nginx load balancing
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 shrink-0 text-violet-200" />
                  Redis adapter + Kafka fanout for real-time reliability
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 shrink-0 text-violet-200" />
                  Prisma + PostgreSQL data model for communities
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="mt-1 shrink-0 text-violet-200" />
                  Docker-ready deployment and service monitoring
                </li>
              </ul>
            </article>
          </div>
          </div>
        </section>

        <section id="safety" className="mx-auto max-w-7xl border-b border-white/10 px-4 py-16 sm:px-6 md:py-24">
          <div className="reveal-up rounded-3xl border border-violet-200/25 bg-gradient-to-r from-violet-300/12 via-violet-200/6 to-slate-300/10 p-7 md:p-10">
            <div className="grid items-start gap-8 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-100">Safety and moderation</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl [font-family:var(--font-geist-sans)]">
                  Protection defaults that scale with your community.
                </h2>
                <p className="mt-4 text-white/75">
                  Combine manual controls with automation for link filtering, member verification, and role-based moderation paths.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "Automated anti-spam checks",
                  "Channel-level permission controls",
                  "Audit logs for moderation actions",
                  "Invite and onboarding protections",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/85"
                  >
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-200" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="discover" className="border-b border-white/10 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader
            eyebrow="Discover"
            title="From private circles to public fandoms"
            description="Curated categories and search-friendly communities help users find the right place faster."
            center
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Gaming", members: "450K+ communities" },
              { name: "Education", members: "120K+ communities" },
              { name: "Creators", members: "290K+ communities" },
            ].map((card, idx) => (
              <article
                key={card.name}
                className="reveal-up rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-violet-200/45 hover:bg-white/10"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <p className="text-lg font-semibold">{card.name}</p>
                <p className="mt-2 text-sm text-white/70">{card.members}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans for growing communities"
            center
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {plans.map((plan, idx) => (
              <article
                key={plan.name}
                style={{ animationDelay: `${idx * 100}ms` }}
                className={`rounded-3xl border p-6 ${
                  plan.highlight
                    ? "border-violet-200/40 bg-violet-300/10"
                    : "border-white/10 bg-white/5"
                } reveal-up transition duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.highlight ? (
                    <span className="rounded-full bg-violet-300 px-3 py-1 text-xs font-semibold text-[#1d1430]">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-3xl font-semibold">
                  {plan.price}
                  <span className="text-base font-normal text-white/70"> {plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-white/80">
                      <Check size={14} className="mt-0.5 text-violet-200" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-7 w-full rounded-full py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-violet-300 text-[#1d1430] hover:bg-violet-200"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer id="support" className="border-t border-white/10 bg-black/35 px-4 pb-8 pt-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 rounded-3xl border border-violet-200/20 bg-gradient-to-r from-violet-300/12 via-violet-300/8 to-slate-300/10 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-100/90">Ready to launch</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl [font-family:var(--font-geist-sans)]">
              Start building your Qubily community today
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-violet-300 px-5 py-2.5 text-sm font-semibold text-[#1d1430] hover:bg-violet-200"
              >
                Create Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/90 hover:bg-white/10"
              >
                Open in Browser
              </Link>
            </div>
          </div>

          <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/logo.png" alt="Qubily logo" width={32} height={32} className="rounded-md" />
                <span className="text-lg font-semibold [font-family:var(--font-geist-sans)]">Qubily</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm text-white/65">
                Real-time communication platform with messaging, calls, server management, discovery, and moderation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-violet-200/60 hover:text-violet-100"
                >
                  <Download size={14} /> Download
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-violet-200/60 hover:text-violet-100"
                >
                  Open App
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-violet-100/85">Product</p>
              <div className="mt-3 space-y-2 text-sm text-white/75">
                <a href="#features" className="block hover:text-violet-100">Features</a>
                <a href="#product" className="block hover:text-violet-100">Channels and Calls</a>
                <a href="#discover" className="block hover:text-violet-100">Discovery</a>
                <a href="#pricing" className="block hover:text-violet-100">Pricing</a>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-violet-100/85">Platform</p>
              <div className="mt-3 space-y-2 text-sm text-white/75">
                <a href="#moderation" className="block hover:text-violet-100">Moderation</a>
                <a href="#safety" className="block hover:text-violet-100">Safety</a>
                <a href="#support" className="block hover:text-violet-100">Support</a>
                <Link href="/me/profile" className="block hover:text-violet-100">Profile</Link>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-violet-100/85">Resources</p>
              <div className="mt-3 space-y-2 text-sm text-white/75">
                <Link href="/signup" className="block hover:text-violet-100">Create Account</Link>
                <Link href="/login" className="block hover:text-violet-100">Sign In</Link>
                <a href="#discover" className="block hover:text-violet-100">Find Communities</a>
                <a href="#support" className="block hover:text-violet-100">Contact</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 Qubily. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#support" className="hover:text-violet-100">Privacy</a>
              <a href="#support" className="hover:text-violet-100">Terms</a>
              <a href="#support" className="inline-flex items-center gap-1 hover:text-violet-100">
                <Bot size={13} /> Support
              </a>
              <a href="#discover" className="inline-flex items-center gap-1 hover:text-violet-100">
                <Search size={13} /> Discover
              </a>
              <a href="#moderation" className="inline-flex items-center gap-1 hover:text-violet-100">
                <LayoutTemplate size={13} /> Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


