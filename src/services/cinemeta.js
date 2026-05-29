const BASE_URL = "https://v3-cinemeta.strem.io";

async function fetchCatalog(type, { skip = 0, genre = "" } = {}) {
  const genreParam = genre ? `genre=${encodeURIComponent(genre)}&` : "";
  const url = `${BASE_URL}/catalog/${type}/top/${genreParam}skip=${skip}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al cargar catálogo");
  const data = await response.json();
  return data.metas ?? [];
}

async function searchCatalog(type, query) {
  if (!query) return [];
  const url = `${BASE_URL}/catalog/${type}/top/search=${encodeURIComponent(query)}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al buscar");
  const data = await response.json();
  return data.metas ?? [];
}

async function searchByYear(type, year) {
  if (!year) return [];
  const url = `${BASE_URL}/catalog/${type}/top/year=${encodeURIComponent(year)}.json`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.metas ?? [];
}

async function fetchMetaDetails(type, imdbId) {
  const url = `${BASE_URL}/meta/${type}/${imdbId}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al cargar detalle");
  const data = await response.json();
  return data.meta ?? null;
}

export async function fetchTopMovies(opts) { return fetchCatalog("movie", opts); }
export async function searchMovies(query) { return searchCatalog("movie", query); }
export async function searchMoviesByYear(year) { return searchByYear("movie", year); }
export async function fetchMovieDetails(imdbId) { return fetchMetaDetails("movie", imdbId); }

export async function fetchTopSeries(opts) { return fetchCatalog("series", opts); }
export async function searchSeries(query) { return searchCatalog("series", query); }
export async function searchSeriesByYear(year) { return searchByYear("series", year); }
export async function fetchSeriesDetails(imdbId) { return fetchMetaDetails("series", imdbId); }


