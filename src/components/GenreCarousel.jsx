import { useEffect, useState } from "react";

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function GenreCarousel({ title, items, onSelect }) {
  const [shuffledItems, setShuffledItems] = useState([]);

  useEffect(() => {
    setShuffledItems(shuffleArray(items));
  }, [items]);

  if (shuffledItems.length === 0) return null;

  const repeatedItems = [...shuffledItems, ...shuffledItems, ...shuffledItems, ...shuffledItems];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none" />
        <div className="carousel-track flex gap-4">
          {repeatedItems.map((item, index) => (
            <div
              key={`${item.imdbId}-${index}`}
              className="w-36 flex-shrink-0 cursor-pointer transition hover:scale-105"
              onClick={() => onSelect(item)}
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.name}
                  className="aspect-[2/3] w-full rounded-xl object-cover shadow-lg shadow-black/30"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-white/5 text-xs text-slate-500">
                  {item.name}
                </div>
              )}
              <p className="mt-2 line-clamp-1 text-xs text-slate-400">{item.name}</p>
              {item.year && <p className="text-[10px] text-slate-600">{item.year}</p>}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .carousel-track {
          animation: carousel-scroll 80s linear infinite;
          width: max-content;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes carousel-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
