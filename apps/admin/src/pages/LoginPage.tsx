import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to sign in",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <div className="brand-mark">M</div>
          <div>
            <b>Moorish</b>
            <span>Concierge administration</span>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow">Private workspace</p>
          <h1>Exceptional service starts behind the scenes.</h1>
          <p>
            A secure home for your guest relationships, conversations and
            concierge operations.
          </p>
        </div>
        <p className="login-footnote">Marrakech · Morocco</p>
      </section>
      <main className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-heading">
            <span className="login-lock" aria-hidden="true">◆</span>
            <h2>Welcome back</h2>
            <p>Sign in with your administration account.</p>
          </div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <label className="login-field">
            <span>Email address</span>
            <input
              autoComplete="username"
              autoFocus
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@moorishconcierge.com"
              required
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>
          <button className="primary login-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in securely"}
          </button>
          <p className="login-help">
            Access is restricted to active Moorish Concierge users.
          </p>
        </form>
      </main>
    </div>
  );
}
