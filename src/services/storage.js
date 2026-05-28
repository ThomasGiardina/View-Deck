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
  const { data, error } = await supabase
    .from("entries")
    .upsert(dbEntry, { onConflict: "user_id,imdb_id,type" })
    .select()
    .single();
  if (error) {
    console.error("Error saving entry:", error);
    return null;
  }
  return mapEntryToApp(data);
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
    imdb_id: entry.imdbId,
    name: entry.name,
    year: entry.year,
    poster: entry.poster,
    genres: entry.genres || [],
    list: entry.list,
    rating: entry.rating,
    watched_date: entry.watchedDate,
    review: entry.review,
    rewatch_count: entry.rewatchCount,
    current_season: entry.currentSeason,
    current_episode: entry.currentEpisode,
    added_at: entry.addedAt || new Date().toISOString(),
    type: entry.type,
  };
}
