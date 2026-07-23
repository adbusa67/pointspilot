import { FormEvent, useEffect, useRef, useState } from "react";
import { CreditCard, Plane, CheckCircle2 } from "lucide-react";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Input from "../components/Input";
import Button from "../components/Button";
import { getSession, updateUserPoints } from "../lib/auth";
import { formatPoints } from "../lib/format";
import { User } from "../types/user";

const AMEX = "#006FCF";
const AEROPLAN = "#F01428";

function Avatar({ user }: { user: User }) {
  const [failed, setFailed] = useState(false);
  const initial = user.username.trim().charAt(0).toUpperCase() || "?";

  if (failed || !user.avatarUrl) {
    return (
      <div
        className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amex to-aeroplan text-3xl font-bold text-white"
        aria-label={`${user.username} avatar`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={user.avatarUrl}
      alt={`${user.username} avatar`}
      width={96}
      height={96}
      onError={() => setFailed(true)}
      className="h-24 w-24 shrink-0 rounded-full border border-white/10 object-cover"
    />
  );
}

export default function DashboardPage() {
  // ProtectedRoute guarantees a session exists here.
  const [user, setUser] = useState<User>(() => getSession() as User);
  const [amexInput, setAmexInput] = useState(String(user.amexPoints));
  const [aeroplanInput, setAeroplanInput] = useState(String(user.aeroplanPoints));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const isValidInteger = (raw: string): boolean => /^\d+$/.test(raw.trim());

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValidInteger(amexInput) || !isValidInteger(aeroplanInput)) {
      setSaved(false);
      setError("Enter whole numbers of 0 or more (no decimals).");
      return;
    }

    const amex = Number.parseInt(amexInput, 10);
    const aeroplan = Number.parseInt(aeroplanInput, 10);

    const updated = updateUserPoints(user.id, amex, aeroplan);
    if (!updated) {
      setError("Could not save balances. Please try again.");
      return;
    }

    setError(null);
    setUser(updated);
    setAmexInput(String(updated.amexPoints));
    setAeroplanInput(String(updated.aeroplanPoints));

    setSaved(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-5">
            <Avatar user={user} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-white">
                {user.username}
              </h1>
              <p className="truncate text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Points cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StatCard
            title="Amex Membership Rewards"
            value={formatPoints(user.amexPoints)}
            subtitle="Membership Rewards points"
            icon={CreditCard}
            accent={AMEX}
          />
          <StatCard
            title="Aeroplan Points"
            value={formatPoints(user.aeroplanPoints)}
            subtitle="Air Canada Aeroplan miles"
            icon={Plane}
            accent={AEROPLAN}
          />
        </div>

        {/* Edit balances */}
        <Card>
          <h2 className="text-lg font-semibold text-white">Update balances</h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep your points wallet current.
          </p>

          <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Amex Points"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={amexInput}
                onChange={(e) => setAmexInput(e.target.value)}
              />
              <Input
                label="Aeroplan Points"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={aeroplanInput}
                onChange={(e) => setAeroplanInput(e.target.value)}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit">Save Balances</Button>
              {saved ? (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-success animate-fade-in"
                >
                  <CheckCircle2 size={16} />
                  Balances saved!
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        {/* Coming soon */}
        <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Flight optimizer coming soon
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              We'll surface the lowest-points redemption path across partner
              airlines.
            </p>
          </div>
          <Button variant="secondary" disabled aria-disabled="true">
            Find Best Redemption
          </Button>
        </Card>
      </div>
    </div>
  );
}
