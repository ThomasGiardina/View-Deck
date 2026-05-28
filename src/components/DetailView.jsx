import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  fetchMovieDetails,
  fetchSeriesDetails,
} from "../services/cinemeta";
import { translate } from "../services/translate";
import { fetchSeriesEpisodes } from "../services/tvmaze";
import { normalizeMovie } from "../utils/movies";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";
import { loadEntries, upsertEntry, removeEntry } from "../services/storage";
import { translateGenre } from "../data/i18n";

const LISTS = ["watched", "watchlist", "inprogress", "favorites", "abandoned"];

function getListLabel(list, strings) {
  switch (list) {
    case "watched": return strings.watched;
    case "watchlist": return strings.watchlist;
    case "inprogress": return strings.inprogress;
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

export default function DetailView() {
  const { imdbId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { strings, language } = useLanguage();

  const itemFromState = location.state?.item;

  const [detailItem, setDetailItem] = useState(null);
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [detailList, setDetailList] = useState("watchlist");
  const [detailRating, setDetailRating] = useState(0);
  const [detailWatchedDate, setDetailWatchedDate] = useState("");
  const [detailReview, setDetailReview] = useState("");
  const [detailRewatch, setDetailRewatch] = useState(0);
  const [detailCurrentSeason, setDetailCurrentSeason] = useState("");
  const [detailCurrentEpisode, setDetailCurrentEpisode] = useState("");
  const [detailEpisodes, setDetailEpisodes] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [entry, setEntry] = useState(null);

  const contentType = itemFromState?.type || "movie";

  useEffect(() => {
    if (!imdbId) return;
    let cancelled = false;

    const fetchData = async () => {
      setDetailLoading(true);
      setError("");
      setSaveSuccess(false);
      setTranslatedDesc("");

      const fetchFn = contentType === "movie" ? fetchMovieDetails : fetchSeriesDetails;

      try {
        const details = await fetchFn(imdbId);
        if (cancelled) return;
        if (details) {
          const full = normalizeMovie(details);
          setDetailItem(itemFromState || full);
          setDetailFull(full);
          translate(full.description, language).then((t) => {
            if (!cancelled) setTranslatedDesc(t);
          });
        } else if (itemFromState) {
          setDetailItem(itemFromState);
        }
      } catch {
        if (!cancelled) setError(strings.errorDetail);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }

      if (contentType === "series") {
        try {
          const name = (itemFromState || {}).name;
          const episodes = await fetchSeriesEpisodes(imdbId, name);
          if (!cancelled && episodes) setDetailEpisodes(episodes);
        } catch {}
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [imdbId]);

  useEffect(() => {
    if (!user || !imdbId) return;
    loadEntries(user.id).then((entries) => {
      const found = entries.find((e) => e.imdbId === imdbId);
      if (found) {
        setEntry(found);
        setDetailList(found.list);
        setDetailRating(found.rating || 0);
        setDetailWatchedDate(found.watchedDate || "");
        setDetailReview(found.review || "");
        setDetailRewatch(found.rewatchCount || 0);
        setDetailCurrentSeason(found.currentSeason || "");
        setDetailCurrentEpisode(found.currentEpisode || "");
      } else {
        setEntry(null);
        setDetailList("watchlist");
        setDetailRating(0);
        setDetailWatchedDate("");
        setDetailReview("");
        setDetailRewatch(0);
        setDetailCurrentSeason("");
        setDetailCurrentEpisode("");
      }
    });
  }, [user, imdbId]);

  const displayItem = detailFull || detailItem;

  const handleSaveEntry = async () => {
    if (!displayItem || !user) return;
    const newEntry = {
      imdbId: displayItem.imdbId,
      name: displayItem.name,
      year: displayItem.year,
      poster: displayItem.poster,
      genres: displayItem.genres || [],
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
    const result = await upsertEntry(user.id, newEntry);
    if (result) {
      setEntry(result);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleRemoveEntry = async () => {
    if (!displayItem || !user) return;
    await removeEntry(user.id, displayItem.imdbId, contentType);
    setEntry(null);
    setDetailList("watchlist");
    setDetailRating(0);
    setDetailWatchedDate("");
    setDetailReview("");
    setDetailRewatch(0);
    setDetailCurrentSeason("");
    setDetailCurrentEpisode("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !displayItem) {
    return (
      <section className="space-y-8">
        <button
          onClick={() => navigate("/discover")}
          className="group flex items-center gap-2 text-sm text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {strings.back}
        </button>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      </section>
    );
  }

  if (!displayItem) return null;

  return (
    <section className="space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-sm text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
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
              className="w-full rounded-2xl object-cover shadow-2xl shadow-[var(--theme-shadow)]"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-2xl bg-[var(--theme-hover)] text-[var(--theme-text-dim)]">
              {strings.noPoster}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--theme-text)]">{displayItem.name}</h1>
            <p className="mt-2 text-sm text-[var(--theme-text-muted)]">{displayItem.year ?? ""}</p>
          </div>

          {(translatedDesc || displayItem.description) && (
            <p className="text-sm leading-relaxed text-[var(--theme-text-secondary)]">{translatedDesc || displayItem.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {(displayItem.genres || []).map((genre) => (
              <span key={genre} className="rounded-full bg-[var(--theme-hover)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-muted)]">
                {translateGenre(genre, strings)}
              </span>
            ))}
          </div>

          <div className="grid gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 sm:grid-cols-2">
            {displayItem.imdbRating && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[var(--theme-text)]">{displayItem.imdbRating}{strings.ratingSuffix}</p>
                  <p className="text-xs text-[var(--theme-text-dim)]">{strings.imdbRating}</p>
                </div>
              </div>
            )}
            {displayItem.runtime && (
              <div>
                <p className="text-sm font-semibold text-[var(--theme-text)]">{displayItem.runtime}</p>
                <p className="text-xs text-[var(--theme-text-dim)]">{strings.runtime}</p>
              </div>
            )}
            {displayItem.status && (
              <div>
                <p className="text-sm font-semibold text-[var(--theme-text)]">{formatStatus(displayItem.status, strings)}</p>
                <p className="text-xs text-[var(--theme-text-dim)]">{strings.status}</p>
              </div>
            )}
            {displayItem.country && (
              <div>
                <p className="text-sm font-semibold text-[var(--theme-text)]">{displayItem.country}</p>
                <p className="text-xs text-[var(--theme-text-dim)]">{strings.country}</p>
              </div>
            )}
          </div>

          {(detailEpisodes?.totalSeasons > 0 || displayItem.totalSeasons > 0) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--theme-text-secondary)]">{strings.episodes}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([season, count]) => (
                    <div key={season} className="flex items-center justify-between rounded-xl bg-[var(--theme-elevated)] px-4 py-2.5">
                      <span className="text-sm font-medium text-[var(--theme-text-secondary)]">{strings.seasonLabel} {season}</span>
                      <span className="text-sm font-semibold text-[var(--theme-text)]">{count} {strings.episodes}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {displayItem.cast && displayItem.cast.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--theme-text-secondary)]">{strings.cast}</h3>
              <div className="flex flex-wrap gap-2">
                {displayItem.cast.slice(0, 6).map((person) => (
                  <span key={person} className="rounded-full bg-[var(--theme-hover)] px-3 py-1.5 text-xs text-[var(--theme-text-muted)]">
                    {person}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user ? (
            <div className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                {entry ? `${strings.addedToList} ${getListLabel(entry.list, strings)}` : strings.addFormTitle}
              </h3>

              {saveSuccess && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                  {entry ? strings.saveUpdated : strings.saveAdded}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.viewType}</span>
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
                    className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="watchlist" className="bg-[var(--theme-dropdown)]">{strings.watchlist}</option>
                    <option value="watched" className="bg-[var(--theme-dropdown)]">{strings.watchComplete}</option>
                    <option value="inprogress" className="bg-[var(--theme-dropdown)]">{strings.inprogress}</option>
                    <option value="favorites" className="bg-[var(--theme-dropdown)]">{strings.favorites}</option>
                    <option value="abandoned" className="bg-[var(--theme-dropdown)]">{strings.abandoned}</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.rating} {strings.ratingHint}</span>
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
                    className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.watchedDate}</span>
                  <input
                    type="date"
                    value={detailWatchedDate}
                    onChange={(event) => setDetailWatchedDate(event.target.value)}
                    disabled={detailList === "watchlist"}
                    className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.rewatch}</span>
                  <input
                    type="number"
                    min="0"
                    value={detailRewatch}
                    onChange={(event) => setDetailRewatch(Number(event.target.value))}
                    disabled={detailList === "watchlist"}
                    className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>

                {contentType === "series" && (detailEpisodes?.totalSeasons > 0 || displayItem.totalSeasons > 0) && (
                  <>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.currentSeason}</span>
                      <select
                        value={detailCurrentSeason}
                        onChange={(event) => {
                          setDetailCurrentSeason(event.target.value);
                          setDetailCurrentEpisode("");
                        }}
                        disabled={detailList === "watched" || detailList === "watchlist"}
                        className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-[var(--theme-dropdown)]">{strings.selectOption}</option>
                        {Object.keys(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)
                          .sort((a, b) => Number(a) - Number(b))
                          .map((season) => (
                            <option key={season} value={season} className="bg-[var(--theme-dropdown)]">
                              {strings.seasonLabel} {season} ({(detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)[season]} {strings.episodes})
                            </option>
                          ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.currentEpisode}</span>
                      <select
                        value={detailCurrentEpisode}
                        onChange={(event) => setDetailCurrentEpisode(event.target.value)}
                        disabled={!detailCurrentSeason || detailList === "watched" || detailList === "watchlist"}
                        className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-[var(--theme-dropdown)]">{strings.selectOption}</option>
                        {detailCurrentSeason &&
                          Array.from({ length: (detailEpisodes?.episodesBySeason || displayItem.episodesBySeason)[detailCurrentSeason] || 0 }, (_, i) => i + 1).map((ep) => (
                            <option key={ep} value={ep} className="bg-[var(--theme-dropdown)]">
                              {strings.episodeLabel} {ep}
                            </option>
                          ))}
                      </select>
                    </label>
                  </>
                )}
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--theme-text-dim)]">{strings.review}</span>
                <textarea
                  value={detailReview}
                  onChange={(event) => setDetailReview(event.target.value)}
                  disabled={detailList === "watchlist"}
                  className="min-h-[80px] rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-[var(--theme-text)] shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
                >
                  {entry ? strings.updateEntry : strings.add}
                </button>
                {entry && (
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
          ) : (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">
              <p className="mb-4 text-sm text-[var(--theme-text-muted)]">{strings.loginPrompt}</p>
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-[var(--theme-text)] shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
              >
                {strings.login}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
