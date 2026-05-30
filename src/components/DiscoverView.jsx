import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "./MovieCard";
import GenreCarousel from "./GenreCarousel";
import FeaturedCarousel from "./FeaturedCarousel";
import { translateGenre } from "../data/i18n";
import {
  fetchTopMovies,
  searchMovies,
  searchMoviesByYear,
  fetchTopSeries,
  searchSeries,
  searchSeriesByYear,
} from "../services/cinemeta";
import {
  fetchTopAnime,
  fetchCurrentSeasonAnime,
  searchAnime,
  searchAnimeByYear,
  fetchAnimeGenres,
} from "../services/anime";
import { loadEntries } from "../services/storage";
import { deriveSimilarGenres, normalizeMovie } from "../utils/movies";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";

export default function DiscoverView() {
  const { user } = useAuth();
  const { strings, language } = useLanguage();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [genrePage, setGenrePage] = useState(1);
  const [yearPage, setYearPage] = useState(1);
  const [yearItems, setYearItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentType, setContentType] = useState("movie");
  const [detailEpisodes, setDetailEpisodes] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [animeGenres, setAnimeGenres] = useState([]);
  const [animeGenreSlugs, setAnimeGenreSlugs] = useState({});
  const [seasonItems, setSeasonItems] = useState([]);

  useEffect(() => {
    if (user) {
      loadEntries(user.id).then(setEntries);
    } else {
      setEntries([]);
    }
  }, [user]);

  useEffect(() => {
    fetchAnimeGenres({ limit: 20 }).then((genres) => {
      setAnimeGenres(genres);
      const map = {};
      genres.forEach((g) => { map[g.title] = g.slug; });
      setAnimeGenreSlugs(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    const fetchFn = contentType === "movie" ? fetchTopMovies : contentType === "anime" ? fetchTopAnime : fetchTopSeries;
    fetchFn({ skip: 0 })
      .then((data) => setTopItems(data.map(normalizeMovie)))
      .catch(() => setError(strings.errorRecommendations))
      .finally(() => setIsLoading(false));
  }, [contentType]);

  useEffect(() => {
    if (contentType !== "anime") return;
    fetchCurrentSeasonAnime({ skip: 0 })
      .then((data) => setSeasonItems(data.map(normalizeMovie)))
      .catch(() => {});
  }, [contentType]);

  useEffect(() => {
    if (contentType === "anime" && animeGenres.length === 0) return;

    const fetchFn = contentType === "movie" ? fetchTopMovies : contentType === "anime" ? fetchTopAnime : fetchTopSeries;
    const categories = contentType === "anime"
      ? animeGenres.map((g) => g.title)
      : ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Thriller", "Romance", "Animation", "Anime"];
    categories.forEach((genre) => {
      const slug = animeGenreSlugs[genre];
      fetchFn({ skip: 0, genre, slug })
        .then((data) => {
          setCategoryItems((prev) => ({
            ...prev,
            [genre]: data.map(normalizeMovie).slice(0, 20),
          }));
        })
        .catch(() => {});
    });
  }, [contentType, animeGenres]);

  useEffect(() => {
    setGenrePage(1);
  }, [genreFilter]);

  useEffect(() => {
    setYearPage(1);
  }, [yearFilter]);

  useEffect(() => {
    if (!yearFilter) {
      setYearItems([]);
      return;
    }
    setIsLoading(true);
    const fetchFn = contentType === "movie" ? searchMoviesByYear : contentType === "anime" ? searchAnimeByYear : searchSeriesByYear;
    fetchFn(yearFilter)
      .then((data) => setYearItems(data.map(normalizeMovie)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [yearFilter, contentType]);

  useEffect(() => {
    if (!genreFilter) return;
    setIsLoading(true);
    const fetchFn = contentType === "movie" ? fetchTopMovies : contentType === "anime" ? fetchTopAnime : fetchTopSeries;
    const slug = animeGenreSlugs[genreFilter];
    Promise.all([
      fetchFn({ skip: 0, genre: genreFilter, slug }),
      fetchFn({ skip: 20, genre: genreFilter, slug }),
      fetchFn({ skip: 40, genre: genreFilter, slug }),
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
      const searchFn = contentType === "movie" ? searchMovies : contentType === "anime" ? searchAnime : searchSeries;
      searchFn(searchQuery)
        .then((data) => setSearchResults(data.map(normalizeMovie)))
        .catch(() => setError(strings.errorSearch));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, contentType]);

  const similarGenres = useMemo(() => deriveSimilarGenres(entries), [entries]);

  const genreItems = genreFilter ? (categoryItems[genreFilter] || []) : [];

  const currentGenres = useMemo(() => {
    if (contentType === "anime") {
      return animeGenres.length > 0 ? animeGenres.map((g) => g.title) : [];
    }
    return ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Thriller", "Romance", "Animation", "Anime"];
  }, [contentType, animeGenres]);

  const shuffledItems = useMemo(() => {
    let base = topItems;
    if (genreFilter && yearFilter) {
      base = genreItems.filter((item) => item.year === yearFilter);
    } else if (genreFilter) {
      base = genreItems;
    } else if (yearFilter) {
      base = yearItems;
    }
    return [...base].sort(() => Math.random() - 0.5);
  }, [topItems, genreItems, yearItems, genreFilter, yearFilter]);

  const recommendedItems = useMemo(() => {
    if (genreFilter || yearFilter) return shuffledItems;
    if (!similarGenres.length) return shuffledItems;
    const prioritized = shuffledItems.filter((item) =>
      (item.genres || []).some((genre) => similarGenres.includes(genre))
    );
    const remainder = shuffledItems.filter(
      (item) => !prioritized.includes(item)
    );
    return [...prioritized, ...remainder];
  }, [shuffledItems, similarGenres, genreFilter, yearFilter]);

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

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1990; y--) {
      years.push(String(y));
    }
    return years;
  }, []);

  const handleOpenDetail = (item) => {
    navigate(`/detail/${item.imdbId}`, { state: { item, type: contentType } });
  };

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={strings.searchPlaceholder}
              className="w-full rounded-2xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-4 py-3.5 pl-11 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
              {strings.genre}
              <select
                value={genreFilter}
                onChange={(event) => setGenreFilter(event.target.value)}
                className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="" className="bg-[var(--theme-dropdown)]">{strings.all}</option>
                {currentGenres.map((genre) => (
                  <option key={genre} value={genre} className="bg-[var(--theme-dropdown)]">{translateGenre(genre, strings)}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
              {strings.year}
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="" className="bg-[var(--theme-dropdown)]">{strings.all}</option>
                {availableYears.map((year) => (
                  <option key={year} value={year} className="bg-[var(--theme-dropdown)]">{year}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">
              {strings.type}
              <select
                value={contentType}
                onChange={(event) => {
                  setContentType(event.target.value);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="movie" className="bg-[var(--theme-dropdown)]">{strings.typeMovies}</option>
                <option value="series" className="bg-[var(--theme-dropdown)]">{strings.typeSeries}</option>
                <option value="anime" className="bg-[var(--theme-dropdown)]">{strings.typeAnime}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {!searchQuery && (
        <FeaturedCarousel items={recommendedItems} onSelect={handleOpenDetail} strings={strings} />
      )}

      {searchQuery && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">{strings.results}</h2>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--theme-text-dim)]">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                {strings.loading}
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
              <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} strings={strings} />
            ))}
          </div>
        </section>
      )}

      {!searchQuery && !yearFilter && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">{strings.latestReleases}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(contentType === "anime" ? seasonItems : topItems).slice(0, 8).map((item) => (
              <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} strings={strings} />
            ))}
          </div>
        </section>
      )}

      {!searchQuery && genreFilter && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">{translateGenre(genreFilter, strings)}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {genreItems
              .slice((genrePage - 1) * 12, genrePage * 12)
              .map((item) => (
                <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} strings={strings} />
              ))}
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setGenrePage(1)}
              disabled={genrePage === 1}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setGenrePage((p) => Math.max(1, p - 1))}
              disabled={genrePage === 1}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {genrePage > 2 && (
              <button
                onClick={() => setGenrePage(genrePage - 2)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {genrePage - 2}
              </button>
            )}
            {genrePage > 1 && (
              <button
                onClick={() => setGenrePage(genrePage - 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {genrePage - 1}
              </button>
            )}
            <span className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm font-semibold text-[var(--theme-text)]">
              {genrePage}
            </span>
            {genrePage * 12 < genreItems.length && (
              <button
                onClick={() => setGenrePage(genrePage + 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {genrePage + 1}
              </button>
            )}
            {(genrePage + 1) * 12 < genreItems.length && (
              <button
                onClick={() => setGenrePage(genrePage + 2)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {genrePage + 2}
              </button>
            )}
            <button
              onClick={() => setGenrePage((p) => p + 1)}
              disabled={genrePage * 12 >= genreItems.length}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setGenrePage(Math.ceil(genreItems.length / 12))}
              disabled={genrePage * 12 >= genreItems.length}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {!searchQuery && yearFilter && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--theme-text)]">{yearFilter}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {yearItems
              .slice((yearPage - 1) * 12, yearPage * 12)
              .map((item) => (
                <MovieCard key={item.imdbId} item={item} onSelect={handleOpenDetail} actionLabel={strings.details} onAction={handleOpenDetail} strings={strings} />
              ))}
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setYearPage(1)}
              disabled={yearPage === 1}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setYearPage((p) => Math.max(1, p - 1))}
              disabled={yearPage === 1}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {yearPage > 2 && (
              <button
                onClick={() => setYearPage(yearPage - 2)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {yearPage - 2}
              </button>
            )}
            {yearPage > 1 && (
              <button
                onClick={() => setYearPage(yearPage - 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {yearPage - 1}
              </button>
            )}
            <span className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm font-semibold text-[var(--theme-text)]">
              {yearPage}
            </span>
            {yearPage * 12 < yearItems.length && (
              <button
                onClick={() => setYearPage(yearPage + 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {yearPage + 1}
              </button>
            )}
            {(yearPage + 1) * 12 < yearItems.length && (
              <button
                onClick={() => setYearPage(yearPage + 2)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-active)] hover:text-[var(--theme-text)]"
              >
                {yearPage + 2}
              </button>
            )}
            <button
              onClick={() => setYearPage((p) => p + 1)}
              disabled={yearPage * 12 >= yearItems.length}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setYearPage(Math.ceil(yearItems.length / 12))}
              disabled={yearPage * 12 >= yearItems.length}
              className="rounded-lg bg-[var(--theme-active)] px-3 py-1.5 text-sm text-[var(--theme-text-secondary)] transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {!searchQuery && !genreFilter && !yearFilter && (
        <div className="space-y-10">
          {currentGenres.map((category) => (
            <GenreCarousel
              key={category}
              title={translateGenre(category, strings)}
              items={categoryItems[category] || []}
              onSelect={handleOpenDetail}
            />
          ))}
        </div>
      )}
    </section>
  );
}
