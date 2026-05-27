const STORAGE_KEY = "wd_translations";
const API_URL = "https://translate.argosopentech.com/translate";

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
  if (!text || targetLang !== "es") return text;

  const cacheKey = `desc:${text}`;
  const cache = getCache();
  if (cache[cacheKey]) return cache[cacheKey].value;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "es",
        format: "text",
      }),
    });

    if (!res.ok) return text;

    const data = await res.json();
    const translated = data.translatedText || text;
    setCache(cacheKey, translated);
    return translated;
  } catch {
    return text;
  }
}
