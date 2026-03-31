"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowLeft, CheckCircle } from "lucide-react";

type ThemeMode = "light" | "dark";

export default function PricingComingSoonPage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isScrolled, setIsScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Store email in localStorage for demonstration
      const subscribers = JSON.parse(
        localStorage.getItem("pricing-subscribers") || "[]",
      );
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem(
          "pricing-subscribers",
          JSON.stringify(subscribers),
        );
      }
      setIsSubscribed(true);
      setEmail("");
      // Auto-reset after 5 seconds
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (error) {
      console.error("Error subscribing:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          ["--card" as string]: isLight
            ? "rgba(255,255,255,0.88)"
            : "rgba(24,24,28,0.72)",
          ["--card-border" as string]: isLight
            ? "rgba(147,112,219,0.18)"
            : "rgba(147,112,219,0.28)",
          ["--text-soft" as string]: isLight
            ? "#4a465a"
            : "rgba(224,222,240,0.82)",
          ["--muted" as string]: isLight ? "#7a6b97" : "#a291de",
          ["--pill" as string]: isLight
            ? "rgba(147,112,219,0.1)"
            : "rgba(147,112,219,0.16)",
          ["--accent" as string]: isLight ? "#9333ea" : "#a855f7",
          ["--accent-2" as string]: isLight ? "#a855f7" : "#c084fc",
          ["--accent-soft" as string]: isLight
            ? "rgba(147,112,219,0.26)"
            : "rgba(168,85,247,0.34)",
          ["--accent-strong" as string]: isLight ? "#7e22ce" : "#9333ea",
          ["--warm" as string]: isLight ? "#db2777" : "#f472b6",
          ["--cta-grad" as string]: isLight
            ? "linear-gradient(135deg,#7e22ce 0%,#a855f7 100%)"
            : "linear-gradient(135deg,#9333ea 0%,#c084fc 100%)",
          ["--header-bg" as string]: isLight
            ? "rgba(245,243,248,0.85)"
            : "rgba(17,17,20,0.82)",
          ["--header-border" as string]: isLight
            ? "rgba(147,112,219,0.18)"
            : "rgba(147,112,219,0.25)",
          ["--header-shadow" as string]: isLight
            ? "0 10px 28px rgba(30,20,50,0.08)"
            : "0 10px 30px rgba(7,7,10,0.45)",
          ["--danger" as string]: isLight ? "#dc2626" : "#ef4444",
        } as React.CSSProperties
      }
    >
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-float-soft sm:h-80 sm:w-80" />
        <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-fuchsia-500/16 blur-3xl animate-float-soft sm:h-72 sm:w-72 [animation-delay:0.9s]" />
        <div className="absolute bottom-[-18%] left-1/3 h-64 w-64 rounded-full bg-pink-500/10 blur-[80px] animate-gradient-drift sm:h-96 sm:w-96 md:h-[26rem] md:w-[26rem] md:blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.2),transparent_32%)]" />
      </div>

      {/* Header */}
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
            <Image
              src="/logo.png"
              alt="Qubily logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="text-lg font-semibold tracking-tight [font-family:var(--font-geist-sans)]">
              Qubily
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setTheme((v) => (v === "light" ? "dark" : "light"))
              }
              className="hidden items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--accent-soft)] lg:inline-flex"
            >
              {isLight ? "🌙 Dark" : "☀️ Light"}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Coming Soon Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: "var(--pill)" }}
          >
            <Sparkles size={16} className="text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text-soft)]">
              Exciting Changes Ahead
            </span>
          </div>

          {/* Main Heading - Only Premium Coming Soon */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
            Premium{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          {/* Email Notification Section */}
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--pill)]/50 p-8 sm:p-12 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)] mb-4">
              Be the first to know
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
              Get notified when Premium launches
            </h2>
            <p className="text-[var(--text-soft)] mb-8">
              We'll send you early access details and exclusive launch offers.
            </p>

            {isSubscribed ? (
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <CheckCircle size={40} className="text-green-500" />
                <p className="text-lg font-semibold text-green-500">
                  Thank you! We'll notify you soon.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleNotify}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-full border border-[var(--card-border)] bg-[var(--card)] text-white placeholder-[var(--text-soft)] outline-none transition hover:border-[var(--accent-soft)] focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-full font-semibold text-white transition hover:brightness-105 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--cta-grad)" }}
                >
                  {isLoading ? "Notifying..." : "Notify Me"}
                </button>
              </form>
            )}
          </div>

          {/* Back to Home */}
          <div className="mt-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--text-soft)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
