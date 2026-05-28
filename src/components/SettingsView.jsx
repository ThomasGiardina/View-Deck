import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";
import { useTheme } from "../services/ThemeContext";
import { signOut } from "../services/auth";
import { supabase } from "../services/supabase";
import { loadEntries } from "../services/storage";
import { removeEntry } from "../services/storage";

export default function SettingsView() {
  const { user } = useAuth();
  const { strings, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMsg(strings.passwordChanged);
      setPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      showMsg(err.message || strings.passwordError, "error");
    }
  };

  const handleExport = async () => {
    if (!user) return;
    const entries = await loadEntries(user.id);
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watch-deck-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg(strings.dataExported);
  };

  const handleClearCache = () => {
    localStorage.removeItem("wd_translations");
    showMsg(strings.cacheCleared);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    const entries = await loadEntries(user.id);
    for (const entry of entries) {
      await removeEntry(user.id, entry.imdbId, entry.type);
    }
    showMsg(strings.dataDeleted);
    setConfirmDelete(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/discover");
  };

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-[var(--theme-text)]">{strings.settings}</h1>

      {msg && (
        <div className={`rounded-xl border p-3 text-sm ${
          msg.type === "error"
            ? "border-red-500/20 bg-red-500/5 text-red-300"
            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
        }`}>
          {msg.text}
        </div>
      )}

      {!user && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">
          <p className="mb-4 text-sm text-[var(--theme-text-muted)]">{strings.settingsLoginPrompt}</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
          >
            {strings.loginToSettings}
          </button>
        </div>
      )}

      {user && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--theme-text)]">{strings.account}</h2>
            <div className="space-y-3">
              <div className="rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                <p className="text-xs text-[var(--theme-text-dim)]">{strings.email}</p>
                <p className="text-sm text-[var(--theme-text)]">{user.email}</p>
              </div>

              {passwordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={strings.newPassword}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      {strings.changePassword}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordForm(false)}
                      className="rounded-xl border border-[var(--theme-border)] px-4 py-2 text-sm text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
                    >
                      {strings.cancel || "Cancelar"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setPasswordForm(true)}
                  className="text-sm text-indigo-400 transition hover:text-indigo-300"
                >
                  {strings.changePassword}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--theme-text)]">{strings.preferences}</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-[var(--theme-text-secondary)]">{strings.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="es" className="bg-[var(--theme-dropdown)]">Español</option>
                  <option value="en" className="bg-[var(--theme-dropdown)]">English</option>
                </select>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-[var(--theme-text-secondary)]">{strings.theme}</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="dark" className="bg-[var(--theme-dropdown)]">{strings.darkTheme}</option>
                  <option value="light" className="bg-[var(--theme-dropdown)]">{strings.lightTheme}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--theme-text)]">{strings.data}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                <div>
                  <p className="text-sm text-[var(--theme-text)]">{strings.exportData}</p>
                  <p className="text-xs text-[var(--theme-text-dim)]">{strings.exportDescription}</p>
                </div>
                <button
                  onClick={handleExport}
                  className="rounded-lg bg-indigo-600/80 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
                >
                  {strings.exportData}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                <div>
                  <p className="text-sm text-[var(--theme-text)]">{strings.clearCache}</p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="rounded-lg border border-[var(--theme-border)] px-4 py-2 text-xs font-medium text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
                >
                  {strings.clearCache}
                </button>
              </div>

              {confirmDelete ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="mb-3 text-sm text-red-300">{strings.deleteConfirm}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAllData}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                    >
                      {strings.deleteAllData}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-[var(--theme-border)] px-4 py-2 text-xs font-medium text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
                    >
                      {strings.cancel || "Cancelar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                  <p className="text-sm text-red-400">{strings.deleteAllData}</p>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-lg border border-red-500/20 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    {strings.deleteAllData}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {user && (
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-red-500/20 px-6 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
        >
          {strings.logoutFromSettings}
        </button>
      )}

      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--theme-text)]">{strings.about}</h2>
        <p className="text-sm text-[var(--theme-text-dim)]">Watch Deck {strings.appVersion}</p>
      </div>
    </section>
  );
}
