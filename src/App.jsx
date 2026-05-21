import { useEffect, useMemo, useState } from "react";
import MovieCard from "./components/MovieCard.jsx";
import GenreCarousel from "./components/GenreCarousel.jsx";
import FeaturedCarousel from "./components/FeaturedCarousel.jsx";
import LanguageToggle from "./components/LanguageToggle.jsx";
import { GENRES } from "./data/genres.js";
import { STRINGS } from "./data/i18n.js";
import {
  fetchMovieDetails,
  fetchTopMovies,
  searchMovies,
  fetchSeriesDetails,
  fetchTopSeries,
  searchSeries,
} from "./services/cinemeta.js";
import { loadEntries, loadPrefs, saveEntries, savePrefs } from "./services/storage.js";
import { fetchSeriesEpisodes } from "./services/tvmaze.js";
import { deriveSimilarGenres, normalizeMovie, sortEntries } from "./utils/movies.js";

const LISTS = ["watched", "watchlist", "inprogress", "favorites", "abandoned"];
const MAIN_TABS = ["discover", "mylists"];

const LIST_ICONS = {
  watched: "🎬",
  watchlist: "📋",
  inprogress: "▶️",
  favorites: "❤️",
  abandoned: "⏸️",
};

const LIST_GRADIENTS = {
  watched: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  watchlist: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  inprogress: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  favorites: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
  abandoned: "from-slate-500/10 to-zinc-500/5 border-slate-500/20",
};

function getListLabel(list, strings) {
  switch (list) {
    case "watched": return strings.watched;
    case "watchlist": return strings.watchlist;
    case "favorites": return strings.favorites;
    case "abandoned": return strings.abandoned;
    default: return list;
  }
}

function formatStatus(status, strings) {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower === "ended" || lower === "canceled") return strings.statusEnded;
  if (lower === "returning series" || lower === "running" || lower === "in production") return strings.statusReturning;
  return status;
}

export default function App() {
  const [language, setLanguage] = useState("es");
  const [orderBy, setOrderBy] = useState("addedAt");
  const [entries, setEntries] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [genrePage, setGenrePage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("discover");
  const [activeListTab, setActiveListTab] = useState("all");
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [contentType, setContentType] = useState("movie");
  const [detailItem, setDetailItem] = useState(null);
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailList, setDetailList] = useState("watchlist");
  const [detailRating, setDetailRating] = useState(0);
  const [detailWatchedDate, setDetailWatchedDate] = useState("");
  const [detailReview, setDetailReview] = useState("");
  const [detailRewatch, setDetailRewatch] = useState(0);
  const [detailCurrentSeason, setDetailCurrentSeason] = useState("");
  const [detailCurrentEpisode, setDetailCurrentEpisode] = useState("");
  const [detailEpisodes, setDetailEpisodes] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const strings = STRINGS[language];

  useEffect(() => {
    const prefs = loadPrefs();
    setLanguage(prefs.language || "es");
    setOrderBy(prefs.orderBy || "addedAt");
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    savePrefs({ orderBy, language });
  }, [orderBy, language]);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    const fetchFn = contentType === "movie" ? fetchTopMovies : fetchTopSeries;
    fetchFn({ skip: 0 })
      .then((data) => setTopItems(data.map(normalizeMovie)))
      .catch(() => setError("Error cargando recomendaciones"))
      .finally(() => setIsLoading(false));

    const CATEGORIES = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Thriller", "Romance", "Animation"];
    CATEGORIES.forEach((genre) => {
      fetchFn({ skip: 0, genre })
        .then((data) => {
          setCategoryItems((prev) => ({
            ...prev,
            [genre]: data.map(normalizeMovie).slice(0, 20),
          }));
        })
        .catch(() => {});
    });
  }, [contentType]);

  useEffect(() => {
    setGenrePage(1);
  }, [genreFilter]);

  useEffect(() => {
    if (!genreFilter) return;
    setIsLoading(true);
    const fetchFn = contentType === "movie" ? fetchTopMovies : fetchTopSeries;
    Promise.all([
      fetchFn({ skip: 0, genre: genreFilter }),
      fetchFn({ skip: 20, genre: genreFilter }),
      fetchFn({ skip: 40, genre: genreFilter }),
    ])
      .then(([page1, page2, page3]) => {
        const all = [...page1, ...page2, ...page3].map(normalizeMovie);
        setCategoryItems((prev) => ({
          ...prev,
          [genreFilter]: all,
        }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [genreFilter, contentType]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(() => {
      setError("");
      const searchFn = contentType === "movie" ? searchMovies : searchSeries;
      searchFn(searchQuery)
        .then((data) => setSearchResults(data.map(normalizeMovie)))
        .catch(() => setError("Error en búsqueda"));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, contentType]);

  const similarGenres = useMemo(() => deriveSimilarGenres(entries), [entries]);

  const genreItems = genreFilter ? (categoryItems[genreFilter] || []) : [];

  const shuffledItems = useMemo(() => {
    const base = genreFilter ? genreItems : topItems;
    const shuffled = [...base].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [topItems, genreItems, genreFilter]);

  const recommendedItems = useMemo(() => {
    if (genreFilter) return shuffledItems;
    if (!similarGenres.length) return shuffledItems;
    const prioritized = shuffledItems.filter((item) =>
      (item.genres || []).some((genre) => similarGenres.includes(genre))
    );
    const remainder = shuffledItems.filter(
      (item) => !prioritized.includes(item)
    );
    return [...prioritized, ...remainder];
  }, [shuffledItems, similarGenres, genreFilter]);

  const filterItems = (items) => {
    return items.filter((item) => {
      const matchesGenre = genreFilter ? (item.genres || []).includes(genreFilter) : true;
      const matchesYear = yearFilter ? item.year === yearFilter : true;
      return matchesGenre && matchesYear;
    });
  };

  const filteredResults = useMemo(() => {
    const items = searchQuery ? searchResults : recommendedItems;
    return filterItems(items);
  }, [searchQuery, searchResults, recommendedItems, genreFilter, yearFilter]);

  const entriesByList = useMemo(() => {
    const grouped = LISTS.reduce((acc, list) => {
      acc[list] = [];
      return acc;
    }, {});
    entries.forEach((entry) => {
      if (!grouped[entry.list]) grouped[entry.list] = [];
      grouped[entry.list].push(entry);
    });
    LISTS.forEach((list) => {
      grouped[list] = sortEntries(grouped[list], orderBy);
    });
    return grouped;
  }, [entries, orderBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const rated = entries.filter((e) => e.rating > 0);
    const avgRating = rated.length ? (rated.reduce((sum, e) => sum + e.rating, 0) / rated.length).toFixed(1) : "—";
    const genreCount = {};
    entries.forEach((e) => {
      (e.genres || []).forEach((g) => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, avgRating, topGenre };
  }, [entries]);

  const existingEntry = detailItem
    ? entries.find((entry) => entry.imdbId === detailItem.imdbId)
    : null;

  const handleOpenDetail = async (item) => {
    const normalized = normalizeMovie(item);
    const foundEntry = entries.find((entry) => entry.imdbId === normalized.imdbId) || null;

    setDetailItem(normalized);
    setDetailFull(null);
    setDetailEpisodes(null);
    setDetailLoading(true);
    setSaveSuccess(false);
    setError("");
    setActiveMainTab("detail");

    if (foundEntry) {
      setDetailList(foundEntry.list);
      setDetailRating(foundEntry.rating || 0);
      setDetailWatchedDate(foundEntry.watchedDate || "");
      setDetailReview(foundEntry.review || "");
      setDetailRewatch(foundEntry.rewatchCount || 0);
      setDetailCurrentSeason(foundEntry.currentSeason || "");
      setDetailCurrentEpisode(foundEntry.currentEpisode || "");
    } else {
      setDetailList("watchlist");
      setDetailRating(0);
      setDetailWatchedDate("");
      setDetailReview("");
      setDetailRewatch(0);
      setDetailCurrentSeason("");
      setDetailCurrentEpisode("");
    }

    try {
      const fetchFn = contentType === "movie" ? fetchMovieDetails : fetchSeriesDetails;
      const details = await fetchFn(normalized.imdbId);
      if (details) setDetailFull(normalizeMovie(details));
    } catch {
      setError("Error cargando detalle");
    } finally {
      setDetailLoading(false);
    }

    if (contentType === "series") {
      try {
        const episodes = await fetchSeriesEpisodes(normalized.imdbId, normalized.name);
        if (episodes) setDetailEpisodes(episodes);
      } catch {}
    }
  };

  const handleBackToDiscover = () => {
    setDetailItem(null);
    setDetailFull(null);
    setDetailEpisodes(null);
    setActiveMainTab("discover");
    setSaveSuccess(false);
    setError("");
  };

  const handleSaveEntry = () => {
    if (!detailItem) return;
    const base = detailFull || detailItem;
    const imdbId = base.imdbId;
    const newEntry = {
      imdbId,
      name: base.name,
      year: base.year,
      poster: base.poster,
      genres: base.genres,
      list: detailList,
      rating: detailRating,
      watchedDate: detailWatchedDate,
      review: detailReview,
      rewatchCount: detailRewatch,
      currentSeason: detailCurrentSeason,
      currentEpisode: detailCurrentEpisode,
      addedAt: new Date().toISOString(),
      type: contentType,
    };
    const updated = entries.filter((entry) => entry.imdbId !== imdbId);
    updated.push(newEntry);
    setEntries(updated);
    saveEntries(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRemoveEntry = () => {
    if (!detailItem) return;
    const updated = entries.filter((entry) => entry.imdbId !== detailItem.imdbId);
    setEntries(updated);
    saveEntries(updated);
    setDetailList("watchlist");
    setDetailRating(0);
    setDetailWatchedDate("");
    setDetailReview("");
    setDetailRewatch(0);
    setDetailCurrentSeason("");
    setDetailCurrentEpisode("");
    setDetailEpisodes(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    [...topItems, ...searchResults].forEach((item) => {
      if (item.year) years.add(item.year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [topItems, searchResults]);

  const listsToShow = activeListTab === "all" ? LISTS : [activeListTab];
  const displayItem = detailFull || detailItem;

  const filteredEntriesByList = useMemo(() => {
    if (!listSearchQuery.trim()) return entriesByList;
    const q = listSearchQuery.toLowerCase();
    const filtered = {};
    LISTS.forEach((list) => {
      filtered[list] = entriesByList[list].filter(
        (entry) => entry.name.toLowerCase().includes(q)
      );
    });
    return filtered;
  }, [entriesByList, listSearchQuery]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent" />

      <header className="relative border-b border-white/[0.06] bg-[#0a0a0f]/80 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png?v=3" alt="Watch Deck" className="h-10 w-10 rounded-lg" />
            <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              {strings.appTitle}
            </h1>
          </div>
          <LanguageToggle language={language} onChange={setLanguage} label={strings.language} />
        </div>
      </header>

      <div className="relative mx-auto mt-6 flex max-w-7xl justify-center px-6">
        <nav className="inline-flex gap-1 rounded-2xl bg-white/[0.04] p-1.5 backdrop-blur-sm ring-1 ring-white/[0.08]">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === "discover") handleBackToDiscover();
                else setActiveMainTab(tab);
              }}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeMainTab === tab
                  ? "bg-white/10 text-white shadow-lg shadow-white/5 ring-1 ring-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "discover" ? strings.tabDiscover : strings.tabMyLists}
            </button>
          ))}
        </nav>
      </div>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        {activeMainTab === "discover" && (
          <section className="space-y-8">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={strings.searchPlaceholder}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 pl-11 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {strings.genre}
                    <select
                      value={genreFilter}
                      onChange={(event) => setGenreFilter(event.target.value)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="" className="bg-slate-900">Todos</option>
                      {GENRES.map((genre) => (
                        <option key={genre} value={genre} className="bg-slate-900">{genre}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {strings.year}
                    <select
                      value={yearFilter}
                      onChange={(event) => setYearFilter(event.target.value)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="" className="bg-slate-900">Todos</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year} className="bg-slate-900">{year}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {strings.type}
                    <select
                      value={contentType}
                      onChange={(event) => {
                        setContentType(event.target.value);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="movie" className="bg-slate-900">{strings.typeMovies}</option>
                      <option value="series" className="bg-slate-900">{strings.typeSeries}</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {!searchQuery && (
              <FeaturedCarousel items={recommendedItems} onSelect={handleOpenDetail} />
            )}

            {searchQuery && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{strings.results}</h2>
                  </div>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Cargando...
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredResults.slice(0, 8).map((item) => (
                    <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} />
                  ))}
                </div>
              </section>
            )}

            {!searchQuery && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{strings.latestReleases}</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {topItems.slice(0, 8).map((item) => (
                    <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} />
                  ))}
                </div>
              </section>
            )}

            {!searchQuery && genreFilter && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{genreFilter}</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {genreItems
                    .slice((genrePage - 1) * 12, genrePage * 12)
                    .map((item) => (
                      <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} />
                    ))}
                </div>
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setGenrePage(1)}
                    disabled={genrePage === 1}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setGenrePage((p) => Math.max(1, p - 1))}
                    disabled={genrePage === 1}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {genrePage > 2 && (
                    <button
                      onClick={() => setGenrePage(genrePage - 2)}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      {genrePage - 2}
                    </button>
                  )}
                  {genrePage > 1 && (
                    <button
                      onClick={() => setGenrePage(genrePage - 1)}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      {genrePage - 1}
                    </button>
                  )}
                  <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
                    {genrePage}
                  </span>
                  {genrePage * 12 < genreItems.length && (
                    <button
                      onClick={() => setGenrePage(genrePage + 1)}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      {genrePage + 1}
                    </button>
                  )}
                  {(genrePage + 1) * 12 < genreItems.length && (
                    <button
                      onClick={() => setGenrePage(genrePage + 2)}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      {genrePage + 2}
                    </button>
                  )}
                  <button
                    onClick={() => setGenrePage((p) => p + 1)}
                    disabled={genrePage * 12 >= genreItems.length}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setGenrePage(Math.ceil(genreItems.length / 12))}
                    disabled={genrePage * 12 >= genreItems.length}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}

            {!searchQuery && !genreFilter && (
              <div className="space-y-10">
                {["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Thriller", "Romance", "Animation"].map((category) => (
                  <GenreCarousel
                    key={category}
                    title={category}
                    items={categoryItems[category] || []}
                    onSelect={handleOpenDetail}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeMainTab === "detail" && displayItem && (
          <section className="space-y-8">
            <button
              onClick={handleBackToDiscover}
              className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {strings.back}
            </button>

            <div className="flex flex-col gap-8 md:flex-row">
              <div className="w-full md:w-80 md:flex-shrink-0">
                {displayItem.poster ? (
                  <img
                    src={displayItem.poster}
                    alt={displayItem.name}
                    className="w-full rounded-2xl object-cover shadow-2xl shadow-black/40"
                  />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                    Sin poster
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">{displayItem.name}</h1>
                  <p className="mt-2 text-sm text-slate-400">{displayItem.year ?? ""}</p>
                </div>

                {displayItem.description && (
                  <p className="text-sm leading-relaxed text-slate-300">{displayItem.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {(displayItem.genres || []).map((genre) => (
                    <span key={genre} className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400">
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:grid-cols-2">
                  {displayItem.imdbRating && (
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-white">{displayItem.imdbRating}/10</p>
                        <p className="text-xs text-slate-500">{strings.imdbRating}</p>
                      </div>
                    </div>
                  )}
                  {displayItem.runtime && (
                    <div>
                      <p className="text-sm font-semibold text-white">{displayItem.runtime}</p>
                      <p className="text-xs text-slate-500">{strings.runtime}</p>
                    </div>
                  )}
                  {displayItem.status && (
                    <div>
                      <p className="text-sm font-semibold text-white">{formatStatus(displayItem.status, strings)}</p>
                      <p className="text-xs text-slate-500">{strings.status}</p>
                    </div>
                  )}
                  {displayItem.country && (
                    <div>
                      <p className="text-sm font-semibold text-white">{displayItem.country}</p>
                      <p className="text-xs text-slate-500">{strings.country}</p>
                    </div>
                  )}
                </div>

                {(detailEpisodes?.totalSeasons > 0 || displayItem.totalSeasons > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">{strings.episodes}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)
                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                        .map(([season, count]) => (
                          <div key={season} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5">
                            <span className="text-sm font-medium text-slate-300">{strings.seasonLabel} {season}</span>
                            <span className="text-sm font-semibold text-white">{count} {strings.episodes}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {displayItem.cast && displayItem.cast.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300">{strings.cast}</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayItem.cast.slice(0, 6).map((person) => (
                        <span key={person} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white">
                    {existingEntry ? `${strings.addedToList} ${getListLabel(existingEntry.list, strings)}` : "Agregar a Mi Lista"}
                  </h3>

                  {saveSuccess && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                      {existingEntry ? "Entrada actualizada" : "Agregado correctamente"}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.viewType}</span>
                      <select
                        value={detailList}
                        onChange={(event) => {
                          setDetailList(event.target.value);
                          if (event.target.value === "watched") {
                            setDetailCurrentSeason("");
                            setDetailCurrentEpisode("");
                          }
                          if (event.target.value === "watchlist") {
                            setDetailRating(0);
                            setDetailWatchedDate("");
                            setDetailReview("");
                            setDetailRewatch(0);
                            setDetailCurrentSeason("");
                            setDetailCurrentEpisode("");
                          }
                        }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="watchlist" className="bg-slate-900">{strings.watchlist}</option>
                        <option value="watched" className="bg-slate-900">{strings.watchComplete}</option>
                        <option value="inprogress" className="bg-slate-900">{strings.inprogress}</option>
                        <option value="favorites" className="bg-slate-900">{strings.favorites}</option>
                        <option value="abandoned" className="bg-slate-900">{strings.abandoned}</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.rating} (1-10)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={detailRating || ""}
                        onChange={(event) => {
                          const val = event.target.value.replace(/[^0-9]/g, "");
                          const num = Number(val);
                          if (val === "" || (num >= 1 && num <= 10)) {
                            setDetailRating(val === "" ? 0 : num);
                          }
                        }}
                        placeholder="—"
                        disabled={detailList === "watchlist"}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.watchedDate}</span>
                      <input
                        type="date"
                        value={detailWatchedDate}
                        onChange={(event) => setDetailWatchedDate(event.target.value)}
                        disabled={detailList === "watchlist"}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.rewatch}</span>
                      <input
                        type="number"
                        min="0"
                        value={detailRewatch}
                        onChange={(event) => setDetailRewatch(Number(event.target.value))}
                        disabled={detailList === "watchlist"}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>

                    {contentType === "series" && (detailEpisodes?.totalSeasons > 0 || displayItem.totalSeasons > 0) && (
                      <>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.currentSeason}</span>
                          <select
                            value={detailCurrentSeason}
                            onChange={(event) => {
                              setDetailCurrentSeason(event.target.value);
                              setDetailCurrentEpisode("");
                            }}
                            disabled={detailList === "watched" || detailList === "watchlist"}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" className="bg-slate-900">Seleccionar</option>
                            {Object.keys(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)
                              .sort((a, b) => Number(a) - Number(b))
                              .map((season) => (
                                <option key={season} value={season} className="bg-slate-900">
                                  {strings.seasonLabel} {season} ({(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)[season]} {strings.episodes})
                                </option>
                              ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.currentEpisode}</span>
                          <select
                            value={detailCurrentEpisode}
                            onChange={(event) => setDetailCurrentEpisode(event.target.value)}
                            disabled={!detailCurrentSeason || detailList === "watched" || detailList === "watchlist"}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" className="bg-slate-900">Seleccionar</option>
                            {detailCurrentSeason &&
                              Array.from({ length: (detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)[detailCurrentSeason] || 0 }, (_, i) => i + 1).map((ep) => (
                                <option key={ep} value={ep} className="bg-slate-900">
                                  {strings.episodeLabel} {ep}
                                </option>
                              ))}
                          </select>
                        </label>
                      </>
                    )}
                  </div>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{strings.review}</span>
                    <textarea
                      value={detailReview}
                      onChange={(event) => setDetailReview(event.target.value)}
                      disabled={detailList === "watchlist"}
                      className="min-h-[80px] rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveEntry}
                      className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
                    >
                      {existingEntry ? strings.updateEntry : strings.add}
                    </button>
                    {existingEntry && (
                      <button
                        type="button"
                        onClick={handleRemoveEntry}
                        className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                      >
                        {strings.removeFromList}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeMainTab === "mylists" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setActiveListTab("all"); setListSearchQuery(""); }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activeListTab === "all"
                      ? "bg-white/10 text-white ring-1 ring-white/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas
                </button>
                {LISTS.map((list) => (
                  <button
                    key={list}
                    onClick={() => { setActiveListTab(list); setListSearchQuery(""); }}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      activeListTab === list
                        ? "bg-white/10 text-white ring-1 ring-white/10"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {LIST_ICONS[list]} {getListLabel(list, strings)}
                    <span className="ml-1.5 text-xs opacity-60">({entriesByList[list].length})</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{strings.orderBy}</span>
                <select
                  value={orderBy}
                  onChange={(event) => setOrderBy(event.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="addedAt" className="bg-slate-900">{strings.addedAt}</option>
                  <option value="rating" className="bg-slate-900">{strings.ratingOrder}</option>
                </select>
              </div>
            </div>

            <div className="relative max-w-md">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={listSearchQuery}
                onChange={(event) => setListSearchQuery(event.target.value)}
                placeholder={strings.searchInLists}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 pl-10 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {entries.length > 0 && (
              <div className="grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:grid-cols-3">
                <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="mt-1 text-xs text-slate-500">{strings.statsTotal}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
                  <p className="mt-1 text-xs text-slate-500">{strings.statsAvgRating}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.topGenre}</p>
                  <p className="mt-1 text-xs text-slate-500">{strings.statsTopGenre}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {listsToShow.map((list) => (
                <div
                  key={list}
                  className={`overflow-hidden rounded-3xl border bg-gradient-to-br ${LIST_GRADIENTS[list]}`}
                >
                  <div className="border-b border-white/[0.06] px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{LIST_ICONS[list]}</span>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {getListLabel(list, strings)}
                        </h3>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                          {entriesByList[list].length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {filteredEntriesByList[list].length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-slate-500">{listSearchQuery ? "Sin resultados" : strings.listEmpty}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEntriesByList[list].map((entry) => (
                        <button
                          key={entry.imdbId}
                          onClick={() => {
                            setContentType(entry.type || "movie");
                            handleOpenDetail(entry);
                          }}
                          className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.06]"
                        >
                          {entry.poster ? (
                            <img
                              src={entry.poster}
                              alt={entry.name}
                              className="h-16 w-12 flex-shrink-0 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-16 w-12 flex-shrink-0 rounded-lg bg-white/5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-100">{entry.name}</p>
                            <p className="text-xs text-slate-500">{entry.year}</p>
                            {entry.currentSeason && entry.currentEpisode && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                                  S{entry.currentSeason}E{entry.currentEpisode}
                                </span>
                              </div>
                            )}
                            {entry.rating > 0 && (
                              <div className="mt-1 flex items-center gap-1">
                                <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs font-medium text-amber-400">{entry.rating}/10</span>
                              </div>
                            )}
                          </div>
                          <svg className="h-4 w-4 flex-shrink-0 text-slate-600 transition-colors group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="relative bg-[#0a0a0f]">
        <div className="mx-auto max-w-7xl px-6 pt-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <p className="max-w-sm text-sm text-slate-500">
              Guardá, calificá y organizá películas y series en un solo lugar. Tu biblioteca personal, siempre a mano.
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
            <img src="/favicon.png?v=3" alt="Watch Deck" className="h-20 w-20 rounded-2xl" />
            <h2 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl lg:text-8xl">
              Watch Deck
            </h2>
          </div>
        </div>

        <div className="mt-2 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Watch Deck</p>
            <div className="flex gap-6">
              <button
                onClick={() => { setActiveMainTab("discover"); }}
                className="text-xs text-slate-600 transition hover:text-slate-400"
              >
                Descubrir
              </button>
              <button
                onClick={() => { setActiveMainTab("mylists"); }}
                className="text-xs text-slate-600 transition hover:text-slate-400"
              >
                Mi Lista
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
