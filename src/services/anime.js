const KITSU_API = "https://kitsu.io/api/edge";

const CATEGORY_SLUGS = {
  Action: "action",
  Adventure: "adventure",
  Comedy: "comedy",
  Drama: "drama",
  Fantasy: "fantasy",
  Romance: "romance",
  "Sci-Fi": "science-fiction",
  Thriller: "thriller",
};

function normalizeKitsuAnime(data, included = []) {
  const attr = data.attributes;
  const categoryIds = (data.relationships?.categories?.data || []).map((c) => c.id);
  const genres = categoryIds
    .map((id) => included.find((inc) => inc.id === id && inc.type === "categories"))
    .filter(Boolean)
    .map((cat) => cat.attributes.title);

  return {
    imdbId: data.id,
    name: attr.canonicalTitle || attr.titles?.en || "",
    year: attr.startDate ? attr.startDate.slice(0, 4) : "",
    poster: attr.posterImage?.original || attr.posterImage?.medium || "",
    background: attr.coverImage?.original || "",
    logo: "",
    genres,
    description: attr.synopsis || attr.description || "",
    imdbRating: attr.averageRating ? (Number(attr.averageRating) / 10).toFixed(1) : "",
    cast: [],
    director: "",
    writer: [],
    country: "",
    runtime: attr.episodeLength ? `${attr.episodeLength} min` : "",
    status: attr.status || "",
    videos: [],
    totalEpisodes: attr.episodeCount || 0,
    totalSeasons: 0,
    episodesBySeason: {},
  };
}

export async function fetchTopAnime({ skip = 0, genre = "" } = {}) {
  let url = `${KITSU_API}/anime?sort=-userCount&page[limit]=20&page[offset]=${skip}&include=categories`;
  if (genre && CATEGORY_SLUGS[genre]) {
    url += `&filter[categories]=${CATEGORY_SLUGS[genre]}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar anime");
  const json = await res.json();
  return (json.data || []).map((d) => normalizeKitsuAnime(d, json.included));
}

export async function searchAnime(query) {
  if (!query) return [];
  const url = `${KITSU_API}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=20&include=categories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al buscar anime");
  const json = await res.json();
  return (json.data || []).map((d) => normalizeKitsuAnime(d, json.included));
}

export async function searchAnimeByYear(year) {
  if (!year) return [];
  const url = `${KITSU_API}/anime?filter[seasonYear]=${encodeURIComponent(year)}&sort=-userCount&page[limit]=20&include=categories`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map((d) => normalizeKitsuAnime(d, json.included));
}

export async function fetchAnimeDetails(kitsuId) {
  const url = `${KITSU_API}/anime/${kitsuId}?include=categories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar detalle de anime");
  const json = await res.json();
  const data = json.data;
  if (!data) return null;
  return normalizeKitsuAnime(data, json.included);
}

export async function fetchAnimeEpisodes(kitsuId) {
  const url = `${KITSU_API}/anime/${kitsuId}/episodes?page[limit]=5000`;
  const res = await fetch(url);
  if (!res.ok) return { episodesBySeason: {}, totalSeasons: 0, totalEpisodes: 0 };
  const json = await res.json();
  const episodesBySeason = {};
  (json.data || []).forEach((ep) => {
    const season = String(ep.attributes.seasonNumber);
    episodesBySeason[season] = (episodesBySeason[season] || 0) + 1;
  });
  const totalEpisodes = Object.values(episodesBySeason).reduce((a, b) => a + b, 0);
  return {
    episodesBySeason,
    totalSeasons: Object.keys(episodesBySeason).length,
    totalEpisodes,
  };
}
