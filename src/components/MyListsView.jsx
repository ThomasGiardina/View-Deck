import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, CheckCheck, Bookmark, Play, Heart, XCircle } from "lucide-react";
import { loadEntries } from "../services/storage";
import { sortEntries } from "../utils/movies";
import { useAuth } from "../services/AuthContext";
import { useLanguage } from "../services/LanguageContext";


const LISTS = ["watched", "watchlist", "inprogress", "favorites", "abandoned"];

const LIST_ACCENTS = {
  watched: "border-l-2 border-l-emerald-500",
  watchlist: "border-l-2 border-l-amber-500",
  inprogress: "border-l-2 border-l-blue-500",
  favorites: "border-l-2 border-l-rose-500",
  abandoned: "border-l-2 border-l-slate-500",
};

const LIST_ICONS = {
  watched: CheckCheck,
  watchlist: Bookmark,
  inprogress: Play,
  favorites: Heart,
  abandoned: XCircle,
};

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

export default function MyListsView() {
  const { user } = useAuth();
  const { strings, orderBy } = useLanguage();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeListTab, setActiveListTab] = useState("all");
  const [listSearchQuery, setListSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadEntries(user.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [user]);

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

  const listsToShow = activeListTab === "all" ? LISTS : [activeListTab];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveListTab("all"); setListSearchQuery(""); }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeListTab === "all"
                ? "bg-[var(--theme-active)] text-[var(--theme-text)] ring-1 ring-white/10"
                : "text-[var(--theme-text-muted)] hover:text-slate-200"
            }`}
          >
            <List className="mr-1.5 inline-block h-3.5 w-3.5" />
            {strings.all}
          </button>
          {LISTS.map((list) => {
            const Icon = LIST_ICONS[list];
            return (
              <button
                key={list}
                onClick={() => { setActiveListTab(list); setListSearchQuery(""); }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  activeListTab === list
                    ? "bg-[var(--theme-active)] text-[var(--theme-text)] ring-1 ring-white/10"
                    : "text-[var(--theme-text-muted)] hover:text-slate-200"
                }`}
              >
                <Icon className="mr-1.5 inline-block h-3.5 w-3.5" />
                {getListLabel(list, strings)}
                <span className="ml-1.5 text-xs opacity-60">({entriesByList[list].length})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={listSearchQuery}
          onChange={(event) => setListSearchQuery(event.target.value)}
          placeholder={strings.searchInLists}
          className="w-full rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-elevated)] px-3 py-2.5 pl-10 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] transition focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {entries.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <div className="rounded-xl border border-[var(--theme-border-input)] bg-[var(--theme-surface)] px-3 py-3 text-center">
              <p className="text-lg font-bold text-[var(--theme-text)]">{stats.total}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[var(--theme-text-dim)]">
                <List className="h-3 w-3" />
                {strings.statsTotal}
              </p>
            </div>
            {LISTS.map((list) => {
              const Icon = LIST_ICONS[list];
              return (
                <div key={list} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-[var(--theme-text)]">{entriesByList[list].length}</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[var(--theme-text-dim)]">
                    <Icon className="h-3 w-3" />
                    {getListLabel(list, strings)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--theme-text-dim)]">
            <span>{strings.statsTotal}: <strong className="text-[var(--theme-text-secondary)]">{stats.total}</strong></span>
            <span className="text-white/[0.06]">|</span>
            <span>{strings.statsAvgRating}: <strong className="text-[var(--theme-text-secondary)]">{stats.avgRating}</strong></span>
            <span className="text-white/[0.06]">|</span>
            <span>{strings.statsTopGenre}: <strong className="text-[var(--theme-text-secondary)]">{stats.topGenre}</strong></span>
          </div>
        </>
      )}

      <div className="space-y-4">
        {listsToShow.map((list) => (
          <div
            key={list}
            className={`overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] ${LIST_ACCENTS[list]}`}
          >
            <div className="border-b border-[var(--theme-border)] px-5 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                  {getListLabel(list, strings)}
                </h3>
                <span className="text-xs text-[var(--theme-text-dim)]">({entriesByList[list].length})</span>
              </div>
            </div>

            {filteredEntriesByList[list].length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[var(--theme-text-dim)]">{listSearchQuery ? strings.noResults : strings.listEmpty}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filteredEntriesByList[list].map((entry) => (
                  <button
                    key={entry.imdbId}
                    onClick={() => {
                      navigate(`/detail/${entry.imdbId}`, { state: { item: entry } });
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-[var(--theme-surface)]"
                  >
                    {entry.poster ? (
                      <img
                        src={entry.poster}
                        alt={entry.name}
                        className="h-12 w-9 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-9 flex-shrink-0 rounded-lg bg-[var(--theme-hover)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="truncate text-sm font-medium text-[var(--theme-text)]">{entry.name}</p>
                        <span className="shrink-0 text-xs text-[var(--theme-text-dim)]">{entry.year}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {entry.rating > 0 && (
                          <span className="text-xs text-amber-400">★ {entry.rating}{strings.ratingSuffix}</span>
                        )}
                        {entry.currentSeason && entry.currentEpisode && (
                          <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-400">
                            {strings.seasonEpisodeFmt.replace("{1}", entry.currentSeason).replace("{2}", entry.currentEpisode)}
                          </span>
                        )}
                        {entry.addedAt && (
                          <span className="text-[11px] text-[var(--theme-text-dim)]">{new Date(entry.addedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <svg className="h-4 w-4 flex-shrink-0 text-[var(--theme-text-dim)] transition-colors group-hover:text-[var(--theme-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  );
}
