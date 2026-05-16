export default function LanguageToggle({ language, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.08]">
        {[
          { key: "es", label: "ES" },
          { key: "en", label: "EN" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              language === option.key
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
