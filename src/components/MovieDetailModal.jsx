import { useEffect, useState } from "react";

export default function MovieDetailModal({ isOpen, onClose, movie, strings, onSave, existing }) {
  const [list, setList] = useState("watchlist");
  const [rating, setRating] = useState(0);
  const [watchedDate, setWatchedDate] = useState("");
  const [review, setReview] = useState("");
  const [rewatchCount, setRewatchCount] = useState(0);

  useEffect(() => {
    if (!movie) return;
    if (existing) {
      setList(existing.list);
      setRating(existing.rating || 0);
      setWatchedDate(existing.watchedDate || "");
      setReview(existing.review || "");
      setRewatchCount(existing.rewatchCount || 0);
      return;
    }
    setList("watchlist");
    setRating(0);
    setWatchedDate("");
    setReview("");
    setRewatchCount(0);
  }, [movie, existing]);

  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0f0f14] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col gap-6 p-6 md:flex-row">
            <div className="w-full md:w-1/3">
              {movie.poster ? (
                <img src={movie.poster} alt={movie.name} className="w-full rounded-2xl object-cover shadow-lg shadow-black/30" />
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                  Sin poster
                </div>
              )}
            </div>

            <div className="flex-1 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{movie.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{movie.year ?? ""}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {movie.description && (
                <p className="text-sm leading-relaxed text-slate-300">{movie.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {(movie.genres || []).map((genre) => (
                  <span key={genre} className="rounded-full bg-white/5 px-3 py-1.5 font-medium text-slate-400">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.myLists}</span>
                  <select
                    value={list}
                    onChange={(event) => setList(event.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="watchlist" className="bg-slate-900">{strings.watchlist}</option>
                    <option value="watched" className="bg-slate-900">{strings.watched}</option>
                    <option value="favorites" className="bg-slate-900">{strings.favorites}</option>
                    <option value="abandoned" className="bg-slate-900">{strings.abandoned}</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.rating} (1-10)</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(event) => setRating(Number(event.target.value))}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.watchedDate}</span>
                  <input
                    type="date"
                    value={watchedDate}
                    onChange={(event) => setWatchedDate(event.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.rewatch}</span>
                  <input
                    type="number"
                    min="0"
                    value={rewatchCount}
                    onChange={(event) => setRewatchCount(Number(event.target.value))}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.review}</span>
                <textarea
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                  className="min-h-[100px] rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <button
                type="button"
                onClick={() => onSave({ list, rating, watchedDate, review, rewatchCount })}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
              >
                {strings.add}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
