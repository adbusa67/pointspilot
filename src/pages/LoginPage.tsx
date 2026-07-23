import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { getSession, loginUser, saveSession } from "../lib/auth";

const DEMO_EMAIL = "demo@pointpilot.com";
const DEMO_PASSWORD = "demo123";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Already authenticated → skip the login screen.
  if (getSession()) {
    return <Navigate to="/dashboard" replace />;
  }

  const attemptLogin = (mail: string, pass: string) => {
    const user = loginUser({ email: mail, password: pass });
    if (!user) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    setError(null);
    saveSession(user);
    navigate("/dashboard", { replace: true });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    attemptLogin(email, password);
  };

  const handleDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    attemptLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:py-16">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">
          Log in to your PointPilot wallet.
        </p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" fullWidth>
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleDemo}
            >
              <Sparkles size={16} />
              Use Demo Account
            </Button>
          </form>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300">Demo credentials</p>
            <p className="mt-1">
              Email: <span className="text-slate-200">{DEMO_EMAIL}</span>
            </p>
            <p>
              Password: <span className="text-slate-200">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account yet?{" "}
          <Link
            to="/register"
            className="font-semibold text-amex hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amex"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
