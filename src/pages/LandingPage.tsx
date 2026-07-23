import { Link } from "react-router-dom";
import { ShieldCheck, Wallet, Sparkles, LucideIcon } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
};

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Simple Access",
    text: "Register and login to your personal points wallet.",
    accent: "#006FCF",
  },
  {
    icon: Wallet,
    title: "Balance Tracking",
    text: "View and update your Amex and Aeroplan points instantly.",
    accent: "#22C55E",
  },
  {
    icon: Sparkles,
    title: "Smart Optimization",
    text: "Find the lowest-points flight redemptions — coming soon.",
    accent: "#F01428",
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow orbs (CSS only) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amex/25 blur-3xl animate-orb-drift" />
        <div className="absolute top-32 right-10 h-64 w-64 rounded-full bg-aeroplan/20 blur-3xl animate-orb-drift [animation-delay:2s]" />
      </div>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="glass mb-6 rounded-full px-4 py-1.5 text-xs font-medium text-slate-300 animate-fade-in">
          Travel rewards, beautifully tracked
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl animate-fade-in">
          Turn your points into better flights
        </h1>
        <p className="mt-5 max-w-xl text-base text-slate-400 sm:text-lg animate-fade-in">
          Track your Amex and Aeroplan balances in one premium dashboard.
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row animate-fade-in">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" fullWidth>
              Get Started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" fullWidth>
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
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
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        PointPilot — Hackathon Demo 2026
      </footer>
    </div>
  );
}
