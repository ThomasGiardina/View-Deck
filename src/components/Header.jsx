import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";
import { getProfile } from "../services/profile";
import { signOut } from "../services/auth";

export default function Header() {
  const { user } = useAuth();
  const { strings } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  const isActive = (path) => location.pathname.startsWith(path);

  const avatarColor = profile?.username
    ? `hsl(${profile.username.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 50%)`
    : "#6366f1";

  const avatarLetter = (profile?.username || user?.email || "?")[0].toUpperCase();

  return (
    <header className="relative border-b border-[var(--theme-border)] bg-[var(--theme-header)] px-6 py-5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/discover")}
        >
          <img src="/favicon.png?v=3" alt={strings.appTitle} className="h-10 w-10 rounded-lg" />
          <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {strings.appTitle}
          </h1>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate("/discover")}
            className={`rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 ${
              isActive("/discover")
                ? "bg-[var(--theme-active)] text-[var(--theme-text)]"
                : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            }`}
          >
            {strings.tabDiscover}
          </button>
          {user && (
            <button
              onClick={() => navigate("/mylists")}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 ${
                isActive("/mylists")
                  ? "bg-[var(--theme-active)] text-[var(--theme-text)]"
                  : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
              }`}
            >
              {strings.tabMyLists}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className={`rounded-xl p-2 text-sm transition-all duration-200 ${
              isActive("/settings")
                ? "bg-[var(--theme-active)] text-[var(--theme-text)]"
                : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            }`}
            title={strings.settings}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarLetter}
                </div>
                {profile?.username && (
                  <span className="text-sm text-[var(--theme-text)]">
                    {profile.username}
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-xl border border-[var(--theme-border)] px-4 py-2 text-xs font-medium text-[var(--theme-text-muted)] transition hover:border-[var(--theme-border-input)] hover:text-[var(--theme-text)]"
              >
                {strings.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-indigo-600/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              {strings.login}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
