const STORAGE_KEY = "watch-deck:v1";
const PREFS_KEY = "watch-deck:prefs";

export function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

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
