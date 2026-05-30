const STORAGE_KEY = "wd_translations";
const API_URL = "https://api.mymemory.translated.net/get";

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
    const res = await fetch(`${API_URL}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    if (!res.ok) return text;

    const data = await res.json();
    const translated = data.responseData?.translatedText || text;
    setCache(cacheKey, translated);
    return translated;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
}
