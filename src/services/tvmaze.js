const BASE_URL = "https://api.tvmaze.com";

async function fetchShowByImdb(imdbId) {
  const cleanId = imdbId.replace("tt", "");
  const url = `${BASE_URL}/lookup/shows?imdb=${cleanId}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function searchShowByName(name) {
  const url = `${BASE_URL}/search/shows?q=${encodeURIComponent(name)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return data[0]?.show || null;
}

async function fetchEpisodes(showId) {
  const url = `${BASE_URL}/shows/${showId}/episodes`;
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchSeriesEpisodes(imdbId, name) {
  try {
    let show = await fetchShowByImdb(imdbId);
    if (!show?.id && name) {
      show = await searchShowByName(name);
    }
    if (!show?.id) return null;
    const episodes = await fetchEpisodes(show.id);
    const episodesBySeason = {};
    episodes.forEach((ep) => {
      const season = ep.season;
      if (season) {
        if (!episodesBySeason[season]) episodesBySeason[season] = 0;
        episodesBySeason[season]++;
      }
    });
    return {
      totalSeasons: Object.keys(episodesBySeason).length,
      totalEpisodes: episodes.length,
      episodesBySeason,
    };
  } catch (err) {
    console.error("TVmaze error:", err);
    return null;
  }
}
