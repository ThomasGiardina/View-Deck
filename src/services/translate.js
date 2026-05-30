const STORAGE_KEY = "wd_translations";
const API_URL = "https://translate.googleapis.com/translate_a/single";

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCache(key, value) {
  try {
    const cache = getCache();
    cache[key] = { value, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function translate(text, targetLang) {
  if (!text || !targetLang || targetLang === "en") return text;

  const cacheKey = `${targetLang}:${text}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey].value;

  try {
    const res = await fetch(`${API_URL}?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    if (!res.ok) return text;

    const data = await res.json();
    const translated = data[0]?.map((s) => s[0]).join("") || text;
    setCache(cacheKey, translated);
    return translated;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
}
