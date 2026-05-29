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
  const [detailRes, relationships] = await Promise.all([
    fetch(`${KITSU_API}/anime/${kitsuId}?include=categories`),
    fetchAnimeRelationships(kitsuId),
  ]);
  if (!detailRes.ok) throw new Error("Error al cargar detalle de anime");
  const json = await detailRes.json();
  const data = json.data;
  if (!data) return null;
  return { ...normalizeKitsuAnime(data, json.included), relationships };
}

export async function fetchAnimeEpisodes(kitsuId) {
  let url = `${KITSU_API}/anime/${kitsuId}/episodes?page[limit]=20`;
  const allRaw = [];

  while (url) {
    const res = await fetch(url);
    if (!res.ok) return { episodes: [], episodesBySeason: {}, totalSeasons: 0, totalEpisodes: 0 };
    const json = await res.json();
    allRaw.push(...(json.data || []));
    url = json.links?.next || null;
  }

  const episodesBySeason = {};
  const episodes = [];
  allRaw.forEach((ep) => {
    const a = ep.attributes;
    const season = String(a.seasonNumber);
    episodesBySeason[season] = (episodesBySeason[season] || 0) + 1;
    episodes.push({
      season: a.seasonNumber,
      number: a.number,
      title: a.canonicalTitle || "",
      thumbnail: a.thumbnail?.original || "",
      synopsis: a.synopsis || "",
    });
  });

  const totalEpisodes = Object.values(episodesBySeason).reduce((a, b) => a + b, 0);
  return {
    episodes,
    episodesBySeason,
    totalSeasons: Object.keys(episodesBySeason).length,
    totalEpisodes,
  };
}

function animeBasic(inc) {
  if (!inc || !inc.attributes) return null;
  const a = inc.attributes;
  return {
    id: inc.id,
    name: a.canonicalTitle || a.titles?.en || "",
    poster: a.posterImage?.original || a.posterImage?.medium || "",
    year: a.startDate ? a.startDate.slice(0, 4) : "",
  };
}

export async function fetchAnimeRelationships(kitsuId) {
  const [srcRes, dstRes] = await Promise.all([
    fetch(`${KITSU_API}/media-relationships?filter[source_id]=${kitsuId}&include=destination`),
    fetch(`${KITSU_API}/media-relationships?filter[destination_id]=${kitsuId}&include=source`),
  ]);

  let prequel = null;
  let sequel = null;

  if (srcRes.ok) {
    const json = await srcRes.json();
    for (const rel of json.data || []) {
      const role = rel.attributes?.role;
      if (role !== "sequel" && role !== "prequel") continue;
      const dstId = rel.relationships?.destination?.data?.id;
      const dst = dstId ? (json.included || []).find((i) => i.id === dstId && i.type === "anime") : null;
      if (!dst) continue;
      if (role === "sequel") prequel = animeBasic(dst);
      if (role === "prequel") sequel = animeBasic(dst);
    }
  }

  if (dstRes.ok) {
    const json = await dstRes.json();
    for (const rel of json.data || []) {
      const role = rel.attributes?.role;
      if (role !== "sequel" && role !== "prequel") continue;
      const srcId = rel.relationships?.source?.data?.id;
      const src = srcId ? (json.included || []).find((i) => i.id === srcId && i.type === "anime") : null;
      if (!src) continue;
      if (role === "sequel") sequel = animeBasic(src);
      if (role === "prequel") prequel = animeBasic(src);
    }
  }

  return { prequel, sequel };
}
