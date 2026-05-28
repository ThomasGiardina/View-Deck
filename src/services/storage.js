import { supabase } from "./supabase";

const PREFS_KEY = "watch-deck:prefs";

export function loadPrefs() {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return { orderBy: "addedAt", language: "es" };
  try {
    return JSON.parse(raw);
  } catch {
    return { orderBy: "addedAt", language: "es" };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadEntries(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    console.error("Error loading entries:", error);
    return [];
  }
  return data.map(mapEntryToApp);
}

export async function upsertEntry(userId, entry) {
  const dbEntry = mapAppToEntry(userId, entry);
  console.log("upsertEntry dbEntry:", dbEntry);

  const { data: existing } = await supabase
    .from("entries")
    .select("id")
    .eq("user_id", userId)
    .eq("imdb_id", entry.imdbId)
    .eq("type", entry.type)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from("entries")
      .update(dbEntry)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("entries")
      .insert(dbEntry)
      .select()
      .single();
  }

  if (result.error) {
    console.error("Error saving entry:", result.error);
    return null;
  }
  return mapEntryToApp(result.data);
}

export async function removeEntry(userId, imdbId, type) {
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("user_id", userId)
    .eq("imdb_id", imdbId)
    .eq("type", type);
  if (error) {
    console.error("Error removing entry:", error);
  }
}

export function loadLocalEntries() {
  const raw = localStorage.getItem("watch-deck:v1");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function mapEntryToApp(dbEntry) {
  return {
    imdbId: dbEntry.imdb_id,
    name: dbEntry.name,
    year: dbEntry.year,
    poster: dbEntry.poster,
    genres: dbEntry.genres || [],
    list: dbEntry.list,
    rating: dbEntry.rating,
    watchedDate: dbEntry.watched_date,
    review: dbEntry.review,
    rewatchCount: dbEntry.rewatch_count,
    currentSeason: dbEntry.current_season,
    currentEpisode: dbEntry.current_episode,
    addedAt: dbEntry.added_at,
    type: dbEntry.type,
  };
}

function mapAppToEntry(userId, entry) {
  return {
    user_id: userId,
    imdb_id: entry.imdbId || "",
    name: entry.name || "",
    year: entry.year || "",
    poster: entry.poster || "",
    genres: entry.genres || [],
    list: entry.list || "watchlist",
    rating: entry.rating ?? 0,
    watched_date: entry.watchedDate || null,
    review: entry.review || null,
    rewatch_count: entry.rewatchCount ?? 0,
    current_season: entry.currentSeason || null,
    current_episode: entry.currentEpisode || null,
    added_at: entry.addedAt || new Date().toISOString(),
    type: entry.type || "movie",
  };
}
