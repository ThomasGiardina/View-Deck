export default function LanguageToggle({ language, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
        {label}
      </span>
      <div className="flex rounded-xl bg-[var(--theme-elevated)] p-1 ring-1 ring-[var(--theme-border-input)]">
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
                ? "bg-[var(--theme-active)] text-[var(--theme-text)] shadow-sm"
                : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
