/**
 * Orquestación de la cartelera.
 *
 * Intenta obtener los datos de TMDB y, cuando no es posible (token ausente,
 * red caída, API responder mal), recurre al respaldo local:
 * `src/data/movies.json` + imágenes de `src/assets/`.
 *
 * Política de degradación:
 * - `pnpm dev`  → usa el respaldo local y marca la interfaz como "datos de muestra".
 * - `pnpm build`→ falla con un error claro. Así Vercel conserva el último
 *                 despliegue correcto en lugar de publicar datos de muestra.
 */
import type { ImageMetadata } from "astro";

import type { BackdropSize, Movie } from "./tmdb";
import { fetchMovies } from "./tmdb";

import localMovies from "../data/movies.json";
import betterman from "../assets/betterman.webp";
import chainsawman from "../assets/chainsawman.webp";
import endgame from "../assets/endgame.webp";
import f1 from "../assets/f1.webp";
import nowayhome from "../assets/nowayhome.webp";
import spiderman from "../assets/spiderman.webp";

/**
 * El JSON usa marcadores "peli1".."peli6" en el campo `image`; aquí se
 * asocian a las imágenes reales del repositorio.
 */
const FALLBACK_IMAGES: Record<string, ImageMetadata> = {
  peli1: betterman,
  peli2: chainsawman,
  peli3: spiderman,
  peli4: endgame,
  peli5: nowayhome,
  peli6: f1,
};

/** Películas de muestra, ya convertidas al modelo `Movie`. */
const FALLBACK_MOVIES: Movie[] = localMovies.map((movie) => ({
  id: movie.image,
  title: movie.subtitle
    ? `${movie.title} - ${movie.subtitle.replace(/\.$/, "")}`
    : movie.title,
  overview: movie.description,
  releaseLabel: movie.date,
  ratingLabel: movie.rating,
  genreLabel: movie.genre,
  image: FALLBACK_IMAGES[movie.image]?.src ?? "/og-cinerama.jpg",
  trailerUrl: movie.trailer,
  isLocal: true,
}));

export interface MovieList {
  movies: Movie[];
  /** true cuando se usó el respaldo local en lugar de datos reales de TMDB. */
  degraded: boolean;
}

/**
 * Devuelve un listado de películas para `path` (ruta relativa a la API de
 * TMDB), con un máximo de `limit` elementos e imágenes de tamaño `imageSize`.
 */
export async function getMovieList(
  path: string,
  limit: number,
  imageSize: BackdropSize,
): Promise<MovieList> {
  try {
    const movies = await fetchMovies(path, limit, imageSize);
    return { movies, degraded: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (import.meta.env.PROD) {
      throw new Error(`[Cinerama] No se pudo construir la cartelera. ${message}`);
    }

    console.warn(
      `[Cinerama] TMDB no disponible; se usan datos locales de muestra. ${message}`,
    );
    return { movies: FALLBACK_MOVIES.slice(0, limit), degraded: true };
  }
}
