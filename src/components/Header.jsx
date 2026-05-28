import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";
import { signOut } from "../services/auth";
import LanguageToggle from "./LanguageToggle";

export default function Header() {
  const { user } = useAuth();
  const { strings, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="relative border-b border-white/[0.06] bg-[#0a0a0f]/80 px-6 py-5 backdrop-blur-xl">
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
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {strings.tabDiscover}
          </button>
          {user && (
            <button
              onClick={() => navigate("/mylists")}
              className={`rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 ${
                isActive("/mylists")
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {strings.tabMyLists}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 md:block">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
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
          <LanguageToggle language={language} onChange={setLanguage} label={strings.language} />
        </div>
      </div>
    </header>
  );
}
