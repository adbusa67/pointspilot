import { Link } from "react-router-dom";
import { ShieldCheck, Wallet, Sparkles, LucideIcon } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import ChatBot from "../components/ChatBot";
import { getSession } from "../lib/auth";

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Personalized award strategy",
    text: "AwardPilot reads your saved balances and only recommends redemptions you can actually book.",
    accent: "#F01428",
  },
  {
    icon: Wallet,
    title: "Every points currency",
    text: "Amex, Chase, Citi, Capital One, airline and hotel programs — with full transfer-partner logic.",
    accent: "#006FCF",
  },
  {
    icon: ShieldCheck,
    title: "Value-first, risk-aware",
    text: "Options ranked by cents-per-point, with warnings on fuel surcharges and irreversible transfers.",
    accent: "#22C55E",
  },
];

export default function LandingPage() {
  const session = getSession();

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow orbs (CSS only) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amex/25 blur-3xl animate-orb-drift" />
        <div className="absolute top-32 right-10 h-64 w-64 rounded-full bg-aeroplan/20 blur-3xl animate-orb-drift [animation-delay:2s]" />
      </div>

      {/* Hero + core chatbot */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 sm:pt-16">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="glass mb-5 rounded-full px-4 py-1.5 text-xs font-medium text-slate-300 animate-fade-in">
            Your AI award-travel strategist
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl animate-fade-in">
            Turn your points into better flights
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-400 sm:text-lg animate-fade-in">
            Tell AwardPilot where you want to go. It builds the highest-value
            award strategy from the points and miles you already have.
          </p>
          {!session ? (
            <p className="mt-3 text-sm text-slate-500 animate-fade-in">
              <Link to="/login" className="text-amex hover:underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link to="/register" className="text-amex hover:underline">
                create an account
              </Link>{" "}
              so AwardPilot can use your real balances.
            </p>
          ) : null}
        </div>

        {/* THE core feature */}
        <div className="animate-fade-in">
          <ChatBot />
        </div>
      </section>

      {/* Supporting features */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text, accent }) => (
            <Card
              key={title}
              className="transition-colors duration-200 hover:border-white/20"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent}1A`, color: accent }}
                aria-hidden="true"
              >
                <Icon size={24} strokeWidth={2} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </Card>
          ))}
        </div>

        {!session ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" fullWidth>
                Create your points wallet
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" fullWidth>
                Manage balances
              </Button>
            </Link>
          </div>
        ) : null}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        PointPilot — Hackathon Demo 2026
      </footer>
    </div>
  );
}
