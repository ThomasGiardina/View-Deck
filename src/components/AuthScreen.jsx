import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, signIn, resetPassword } from "../services/auth";
import { useLanguage } from "../services/LanguageContext";

export default function AuthScreen({ mode }) {
  const { strings } = useLanguage();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (showReset) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess(strings.resetSent);
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/discover");
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess(strings.registerSuccess);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (mode) => {
    setIsLogin(mode === "login");
    setShowReset(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="mx-auto max-w-sm pt-20">
      <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[var(--theme-text)] text-center mb-8">
          {showReset ? strings.resetPassword : isLogin ? strings.login : strings.register}
        </h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>

          {!showReset && (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          )}

          {!showReset && isLogin && (
            <button
              type="button"
              onClick={() => { setShowReset(true); setError(""); setSuccess(""); }}
              className="text-sm text-indigo-400 transition hover:text-indigo-300"
            >
              {strings.forgotPassword}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (showReset ? strings.resetPassword : isLogin ? strings.loggingIn : strings.registering)
              : (showReset ? strings.resetPassword : isLogin ? strings.login : strings.register)}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--theme-text-muted)]">
          {showReset ? (
            <button
              onClick={() => handleToggle(isLogin ? "login" : "register")}
              className="text-indigo-400 hover:text-indigo-300 transition"
            >
              {strings.login}
            </button>
          ) : (
            <>
              {isLogin ? strings.noAccount : strings.hasAccount}{" "}
              <button
                onClick={() => handleToggle(isLogin ? "register" : "login")}
                className="text-indigo-400 hover:text-indigo-300 transition"
              >
                {isLogin ? strings.register : strings.login}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
