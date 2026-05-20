export function normalizeMovie(movie) {
  const videos = movie.videos || [];
  const episodesBySeason = {};
  videos.forEach((v) => {
    if (v.season) {
      if (!episodesBySeason[v.season]) episodesBySeason[v.season] = 0;
      episodesBySeason[v.season]++;
    }
  });
  const totalSeasons = Object.keys(episodesBySeason).length;
  const totalEpisodes = videos.length;
  return {
    imdbId: movie.imdbId || movie.imdb_id || movie.id,
    name: movie.name,
    year: movie.releaseInfo || movie.year,
    poster: movie.poster,
    genres: movie.genres || movie.genre || [],
    description: movie.description,
    imdbRating: movie.imdbRating,
    cast: movie.cast || [],
    director: movie.director,
    writer: movie.writer || [],
    country: movie.country,
    runtime: movie.runtime,
    status: movie.status,
    videos,
    totalEpisodes,
    totalSeasons,
    episodesBySeason,
  };
}

export function deriveSimilarGenres(entries) {
  const watched = entries.filter((entry) => entry.list === "watched");
  const genreCounts = new Map();

  watched.forEach((entry) => {
    (entry.genres || []).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });
  });

  return Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}

export function sortEntries(entries, orderBy) {
  if (orderBy === "rating") {
    return [...entries].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  return [...entries].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}
