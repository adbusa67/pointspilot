import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Plane,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Input from "../components/Input";
import Button from "../components/Button";
import { getSession, updateUserProfile } from "../lib/auth";
import { formatPoints } from "../lib/format";
import { User, WalletEntry, WalletKind } from "../types/user";

const AMEX = "#006FCF";
const AEROPLAN = "#F01428";

const KIND_OPTIONS: { value: WalletKind; label: string }[] = [
  { value: "credit-card", label: "Credit card points" },
  { value: "airline", label: "Airline miles" },
  { value: "hotel", label: "Hotel points" },
];

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `w${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

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

  // --- Core balances form ---
  const [amexInput, setAmexInput] = useState(String(user.amexPoints));
  const [aeroplanInput, setAeroplanInput] = useState(String(user.aeroplanPoints));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  // --- Travel profile + extra wallet form ---
  const [wallet, setWallet] = useState<WalletEntry[]>(user.wallet ?? []);
  const [homeAirports, setHomeAirports] = useState(user.homeAirports ?? "");
  const [preferences, setPreferences] = useState(user.travelPreferences ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const profileTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (profileTimeoutRef.current)
        window.clearTimeout(profileTimeoutRef.current);
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

    const updated = updateUserProfile(user.id, {
      amexPoints: amex,
      aeroplanPoints: aeroplan,
    });
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

  // --- Wallet row helpers ---
  const addWalletRow = (kind: WalletKind) => {
    setWallet((prev) => [
      ...prev,
      { id: newId(), program: "", balance: 0, kind },
    ]);
  };

  const updateWalletRow = (
    id: string,
    patch: Partial<Omit<WalletEntry, "id">>,
  ) => {
    setWallet((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    );
  };

  const removeWalletRow = (id: string) => {
    setWallet((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSaveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate + normalize wallet entries.
    const cleaned: WalletEntry[] = [];
    for (const w of wallet) {
      const program = w.program.trim();
      if (!program) continue; // skip blank rows
      if (!Number.isFinite(w.balance) || w.balance < 0) {
        setProfileSaved(false);
        setProfileError(
          `Enter a valid balance (0 or more) for "${program}".`,
        );
        return;
      }
      cleaned.push({ ...w, program, balance: Math.floor(w.balance) });
    }

    const updated = updateUserProfile(user.id, {
      wallet: cleaned,
      homeAirports: homeAirports.trim(),
      travelPreferences: preferences.trim(),
    });
    if (!updated) {
      setProfileError("Could not save your profile. Please try again.");
      return;
    }

    setProfileError(null);
    setUser(updated);
    setWallet(updated.wallet ?? []);

    setProfileSaved(true);
    if (profileTimeoutRef.current)
      window.clearTimeout(profileTimeoutRef.current);
    profileTimeoutRef.current = window.setTimeout(
      () => setProfileSaved(false),
      2000,
    );
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

        {/* Edit core balances */}
        <Card>
          <h2 className="text-lg font-semibold text-white">Update balances</h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep your points wallet current — AwardPilot uses these balances.
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

        {/* Travel profile + extra wallet */}
        <Card>
          <h2 className="text-lg font-semibold text-white">
            Travel profile &amp; wallet
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Add every points currency, airline, and hotel program you hold, plus
            your travel preferences. AwardPilot uses all of this to personalize
            its strategy.
          </p>

          <form
            onSubmit={handleSaveProfile}
            className="mt-4 flex flex-col gap-5"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Home / preferred airports"
                placeholder="e.g. YYZ, JFK"
                value={homeAirports}
                onChange={(e) => setHomeAirports(e.target.value)}
              />
              <Input
                label="Travel preferences"
                placeholder="e.g. Business class, flexible dates, no red-eyes"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>

            {/* Wallet rows */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Additional balances
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addWalletRow("credit-card")}
                  >
                    <Plus size={15} />
                    Card points
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addWalletRow("airline")}
                  >
                    <Plus size={15} />
                    Airline
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addWalletRow("hotel")}
                  >
                    <Plus size={15} />
                    Hotel
                  </Button>
                </div>
              </div>

              {wallet.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
                  No extra programs yet. Add your Chase, Capital One, United,
                  Marriott, and other balances above.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {wallet.map((w) => {
                    const Icon =
                      w.kind === "hotel"
                        ? Building2
                        : w.kind === "airline"
                          ? Plane
                          : CreditCard;
                    return (
                      <li
                        key={w.id}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center"
                      >
                        <select
                          aria-label="Program type"
                          value={w.kind}
                          onChange={(e) =>
                            updateWalletRow(w.id, {
                              kind: e.target.value as WalletKind,
                            })
                          }
                          className="min-h-[44px] rounded-xl border border-white/10 bg-base-800 px-3 py-2.5 text-sm text-slate-100 focus:border-amex/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amex"
                        >
                          {KIND_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Icon size={16} />
                          </span>
                          <input
                            aria-label="Program name"
                            placeholder="Program (e.g. United MileagePlus)"
                            value={w.program}
                            onChange={(e) =>
                              updateWalletRow(w.id, { program: e.target.value })
                            }
                            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amex/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amex"
                          />
                        </div>

                        <input
                          aria-label="Balance"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          placeholder="Balance"
                          value={Number.isFinite(w.balance) ? w.balance : 0}
                          onChange={(e) =>
                            updateWalletRow(w.id, {
                              balance: Number.parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amex/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amex"
                        />

                        <button
                          type="button"
                          aria-label={`Remove ${w.program || "entry"}`}
                          onClick={() => removeWalletRow(w.id)}
                          className="flex min-h-[44px] items-center justify-center rounded-xl px-3 text-slate-400 transition-colors hover:bg-danger/10 hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {profileError ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300"
              >
                {profileError}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit">Save Profile</Button>
              {profileSaved ? (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-success animate-fade-in"
                >
                  <CheckCircle2 size={16} />
                  Profile saved!
                </span>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
