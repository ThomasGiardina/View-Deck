export default function MovieCard({ item, onSelect, actionLabel, onAction, actionDisabled, strings }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-elevated)] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/20">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--theme-surface)]"
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--theme-text-dim)]">
            {strings?.noPoster}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--theme-text)]">
            {item.name}
          </h3>
          <p className="text-xs text-[var(--theme-text-dim)]">{item.year ?? ""}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 text-[11px]">
          {(item.genres || []).slice(0, 2).map((genre) => (
            <span key={genre} className="rounded-full bg-[var(--theme-hover)] px-2.5 py-1 font-medium text-[var(--theme-text-muted)]">
              {strings?.genreTranslations?.[genre] || genre}
            </span>
          ))}
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={() => onAction(item)}
            disabled={actionDisabled}
            className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
              actionDisabled
                ? "cursor-not-allowed bg-[var(--theme-hover)] text-[var(--theme-text-dim)]"
                : "bg-indigo-600/90 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
