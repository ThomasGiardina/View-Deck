import { useState, useEffect } from "react";

export default function FeaturedCarousel({ items, onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 15000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items.length) return null;

  const visibleItems = items.slice(0, 5);
  const featured = visibleItems[currentIndex];

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % visibleItems.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recomendadas</h2>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] md:h-[420px]">
        <div className="flex h-full flex-col md:flex-row">
          <div className="relative flex-1 overflow-hidden">
            {featured.background ? (
              <img
                src={featured.background}
                alt={featured.name}
                className="h-full w-full object-cover"
              />
            ) : featured.poster ? (
              <img
                src={featured.poster}
                alt={featured.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/5">
                <span className="text-slate-500">Sin imagen</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <div className="flex items-end gap-5">
                {featured.poster && (
                  <img
                    src={featured.poster}
                    alt={featured.name}
                    className="hidden h-40 w-28 flex-shrink-0 rounded-xl object-cover shadow-lg shadow-black/50 md:block"
                  />
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{featured.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{featured.year}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(featured.genres || []).slice(0, 3).map((genre) => (
                      <span key={genre} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onSelect(featured)}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 p-3 md:w-80 md:border-l md:border-white/[0.06]">
            {visibleItems.map((item, index) => (
              <button
                key={item.imdbId}
                onClick={() => setCurrentIndex(index)}
                className={`flex items-center gap-3 rounded-xl p-2 text-left transition-all ${
                  index === currentIndex
                    ? "bg-white/10"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.name}
                    className="h-14 w-10 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-10 flex-shrink-0 rounded-lg bg-white/5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.year}</p>
                </div>
                {index === currentIndex && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70 md:right-[330px]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
