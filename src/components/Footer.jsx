import { useNavigate } from "react-router-dom";
import { useLanguage } from "../services/LanguageContext";

export default function Footer() {
  const { strings } = useLanguage();
  const navigate = useNavigate();

  return (
    <footer className="relative bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <p className="max-w-sm text-sm text-slate-500">
            {strings.footerTagline}
          </p>
          <div className="flex gap-3">
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-slate-400 transition hover:bg-white/15 hover:text-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 1.748.653A6.09 6.09 0 0112 5.803c.88.004 1.768.118 2.606.347.908-.922 1.747-.653 1.747-.653.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-slate-400 transition hover:bg-white/15 hover:text-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6">
          <img src="/favicon.png?v=3" alt={strings.appTitle} className="h-20 w-20 rounded-2xl" />
          <h2 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl lg:text-8xl">
            {strings.appTitle}
          </h2>
        </div>
      </div>

      <div className="mt-2 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-slate-600">{strings.copyright.replace("{year}", new Date().getFullYear())}</p>
          <div className="flex gap-6">
            <button
              onClick={() => navigate("/discover")}
              className="text-xs text-slate-600 transition hover:text-slate-400"
            >
              {strings.tabDiscover}
            </button>
            <button
              onClick={() => navigate("/mylists")}
              className="text-xs text-slate-600 transition hover:text-slate-400"
            >
              {strings.tabMyLists}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
