import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, Database, Info, LogOut } from "lucide-react";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";
import { useTheme } from "../services/ThemeContext";
import { signOut, signIn, resetPassword } from "../services/auth";
import { supabase } from "../services/supabase";
import { getProfile, updateProfile } from "../services/profile";
import { loadEntries } from "../services/storage";
import { removeEntry } from "../services/storage";

const SECTIONS = [
  { key: "cuenta", labelKey: "account", Icon: User },
  { key: "preferencias", labelKey: "preferences", Icon: Settings },
  { key: "datos", labelKey: "data", Icon: Database },
  { key: "acerca", labelKey: "about", Icon: Info },
];

export default function SettingsView() {
  const { user } = useAuth();
  const { strings, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("cuenta");
  const [profile, setProfile] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((data) => {
      if (data) {
        setProfile(data);
        setUsernameInput(data.username || "");
      }
      setProfileLoading(false);
    });
  }, [user]);

  const avatarColor = profile?.username
    ? `hsl(${profile.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 50%)`
    : "#6366f1";

  const avatarLetter = (profile?.username || user?.email || "?")[0].toUpperCase();

  const handleSaveProfile = async () => {
    if (!user) return;
    const name = usernameInput.trim();
    if (name.length < 3) {
      showMsg(strings.usernameLengthError, "error");
      return;
    }
    const result = await updateProfile(user.id, { username: name });
    if (result.error) {
      showMsg(result.error.message || strings.usernameError, "error");
    } else {
      setProfile(result.data);
      showMsg(strings.saved);
    }
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!user) return;
    try {
      const { error: signInError } = await signIn(user.email, currentPassword);
      if (signInError) {
        showMsg(strings.passwordError, "error");
        return;
      }
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

  const handleSendReset = async () => {
    if (!user) return;
    const { error } = await resetPassword(user.email);
    if (error) {
      showMsg(error.message, "error");
    } else {
      setResetSent(true);
      showMsg(strings.resetSent);
      setTimeout(() => setResetSent(false), 5000);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    const entries = await loadEntries(user.id);
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viewdeck-${new Date().toISOString().split("T")[0]}.json`;
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

  const sectionButton = (Section, label) => (
    <button
      key={Section.key}
      onClick={() => setActiveSection(Section.key)}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
        activeSection === Section.key
          ? "bg-indigo-500/10 text-indigo-400"
          : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-elevated)] hover:text-[var(--theme-text)]"
      }`}
    >
      <Section.Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">{strings.settings}</h1>
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">
          <p className="mb-4 text-sm text-[var(--theme-text-muted)]">{strings.settingsLoginPrompt}</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
          >
            {strings.loginToSettings}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--theme-text)]">{strings.settings}</h1>

      {msg && (
        <div className={`mb-6 rounded-xl border p-3 text-sm ${
          msg.type === "error"
            ? "border-red-500/20 bg-red-500/5 text-red-300"
            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="flex shrink-0 flex-col gap-2 md:w-56">
          {SECTIONS.map((s) => sectionButton(s, strings[s.labelKey]))}
          <div className="mt-auto border-t border-[var(--theme-border)] pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              {strings.logoutFromSettings}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">
          {activeSection === "cuenta" && (
            <>
              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8">
                <h2 className="mb-6 text-lg font-semibold text-[var(--theme-text)]">{strings.account}</h2>
                <div className="space-y-5">
                  <div className="rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                    <p className="text-xs text-[var(--theme-text-dim)]">{strings.email}</p>
                    <p className="text-sm text-[var(--theme-text)]">{user.email}</p>
                  </div>

                  {profileLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {avatarLetter}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder={strings.username}
                          maxLength={30}
                          className="w-full rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          onClick={handleSaveProfile}
                          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
                        >
                          {strings.save}
                        </button>
                      </div>
                    </div>
                  )}

                  {passwordForm ? (
                    <form onSubmit={handleChangePassword} className="space-y-5 border-t border-[var(--theme-border)] pt-6">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={strings.currentPassword}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={strings.newPassword}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleSendReset}
                        disabled={resetSent}
                        className="mb-2 text-left text-xs text-[var(--theme-text-dim)] transition hover:text-[var(--theme-text-muted)] disabled:opacity-50"
                      >
                        {strings.forgotPassword}
                      </button>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                          {strings.changePassword}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPasswordForm(false); setCurrentPassword(""); setNewPassword(""); }}
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
            </>
          )}

          {activeSection === "preferencias" && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8">
              <h2 className="mb-6 text-lg font-semibold text-[var(--theme-text)]">{strings.preferences}</h2>
              <div className="space-y-5">
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
          )}

          {activeSection === "datos" && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8">
              <h2 className="mb-6 text-lg font-semibold text-[var(--theme-text)]">{strings.data}</h2>
              <div className="space-y-4">
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
          )}

          {activeSection === "acerca" && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-lg font-bold text-indigo-400">
                  WD
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--theme-text)]">{strings.appTitle}</h2>
                  <p className="text-xs text-[var(--theme-text-dim)]">v{strings.appVersion}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--theme-text-secondary)]">
                {strings.aboutDescription}
              </p>
              <div className="mt-6 rounded-xl bg-[var(--theme-elevated)] px-4 py-3">
                <p className="text-xs text-[var(--theme-text-dim)]">{strings.builtWith}</p>
                <p className="text-sm font-medium text-[var(--theme-text)]">{strings.techStack}</p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <svg className="h-4 w-4 text-[var(--theme-text-muted)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <a
                    href="https://github.com/tomigandini/View-Deck"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 transition hover:text-indigo-300"
                >
                  {strings.sourceCode}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
