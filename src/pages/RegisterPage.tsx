import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { getSession, registerUser, saveSession, VALIDATION } from "../lib/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (getSession()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = registerUser({ email, password, username });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    // Auto-login the freshly created account.
    saveSession(result.user);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:py-16">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Start tracking your travel reward points.
        </p>

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Username"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              hint={`At least ${VALIDATION.usernameMinLength} characters.`}
            />
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
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={`At least ${VALIDATION.passwordMinLength} characters.`}
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create Account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-amex hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amex"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
