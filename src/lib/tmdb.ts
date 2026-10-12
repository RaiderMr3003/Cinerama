/**
 * Integración con la API de TMDB (The Movie Database).
 *
 * Toda la comunicación externa con TMDB pasa por este módulo, para tenerla
 * aislada y centralizar: la validación del token, los errores de red/HTTP, la
 * forma de la respuesta y el formateo de los datos al modelo que usa la
 * interfaz (`Movie`).
 *
 * Nota: el sitio es estático, así que estos `fetch` se ejecutan durante el
 * `build` (o en `pnpm dev`), nunca en el navegador del usuario.
 */

const TMDB_API = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const FALLBACK_IMAGE = "/og-cinerama.jpg";

/** Tamaños de imagen disponibles en el CDN de TMDB. */
export type BackdropSize = "w780" | "w1280";

export interface Genre {
  id: number;
  name: string;
}

/** Modelo normalizado que consumen los componentes, sea cual sea el origen. */
export interface Movie {
  id: string;
  title: string;
  overview: string;
  /** Fecha ya formateada para mostrar, p. ej. "26 dic 2024". */
  releaseLabel: string;
  /** Puntuación ya formateada para mostrar, p. ej. "7.5" o "5/5". */
  ratingLabel: string;
  /** Nombre del género, o "Variado" si no hay datos. */
  genreLabel: string;
  /** URL completa de la imagen (CDN de TMDB o asset local). */
  image: string;
  /** Enlace al tráiler. */
  trailerUrl: string;
  /** true cuando los datos provienen del respaldo local (datos de muestra). */
  isLocal: boolean;
}

/** Error propio para distinguir fallos de TMDB de errores inesperados. */
export class TmdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbError";
  }
}

function getToken(): string {
  const token: string | undefined = import.meta.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new TmdbError(
      "Falta la variable de entorno TMDB_ACCESS_TOKEN. " +
        "Copia .env.example a .env y pega tu Read Access Token de TMDB " +
        "(https://www.themoviedb.org/settings/api).",
    );
  }
  return token;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Acepta tanto rutas relativas (`/movie/now_playing?...`) como URLs completas
 * (`https://api.themoviedb.org/3/movie/now_playing?...`), porque las páginas
 * pasan la URL entera en la prop `fetchUrl`.
 */
function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${TMDB_API}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractStatusMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { status_message?: string };
    return parsed?.status_message ?? "";
  } catch {
    // Cuerpo no JSON: nos quedamos solo con el estado HTTP.
    return "";
  }
}

async function fetchTmdb<T>(path: string): Promise<T> {
  const url = resolveUrl(path);
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json", Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new TmdbError(`No se pudo conectar con TMDB (${url}). ${errorMessage(err)}`);
  }

  let body = "";
  try {
    body = await res.text();
  } catch (err) {
    throw new TmdbError(
      `No se pudo leer la respuesta de TMDB (${url}). ${errorMessage(err)}`,
    );
  }

  if (!res.ok) {
    const detail = extractStatusMessage(body);
    const hint =
      res.status === 401 || res.status === 403
        ? " Revisa que TMDB_ACCESS_TOKEN sea un Read Access Token válido."
        : "";

    throw new TmdbError(
      `TMDB respondió ${res.status}${detail ? ` (${detail})` : ""} en ${url}.${hint}`,
    );
  }

  if (!body.trim()) {
    throw new TmdbError(
      `TMDB respondió ${res.status} con el cuerpo vacío en ${url}. ` +
        "Comprueba que la ruta sea correcta.",
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new TmdbError(
      `TMDB devolvió una respuesta que no es JSON válido en ${url}. ` +
        `Inicio de la respuesta: ${body.slice(0, 80)}`,
    );
  }
}

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatShortDate(iso?: string | null): string {
  if (!iso) return "Fecha por confirmar";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "Fecha por confirmar";
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

function trailerSearchUrl(title: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} trailer`,
  )}`;
}

function resolveGenreLabel(ids: number[] | undefined, genres: Genre[]): string {
  const name = ids
    ?.map((id) => genres.find((genre) => genre.id === id)?.name)
    .find(Boolean);
  return name ?? "Variado";
}

interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  overview?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  genre_ids?: number[];
  backdrop_path?: string | null;
}

/**
 * Lista de géneros.
 *
 * Es un dato decorativo: si TMDB falla, devolvemos `[]` (los componentes
 * muestran "Variado") en lugar de tumbar el build entero.
 */
export async function fetchGenres(): Promise<Genre[]> {
  try {
    const data = await fetchTmdb<{ genres?: Genre[] }>(
      "/genre/movie/list?language=es-ES",
    );
    return Array.isArray(data.genres) ? data.genres : [];
  } catch (err) {
    console.warn(
      `[Cinerama] No se pudieron cargar los géneros: ${
        err instanceof Error ? err.message : String(err)
      } Se mostrará "Variado".`,
    );
    return [];
  }
}

/**
 * Obtiene y normaliza un listado de películas desde TMDB.
 *
 * Lanza `TmdbError` si el token falta, si la red o el HTTP fallan o si la
 * respuesta no tiene la forma esperada. Quien llame decide si degrada.
 */
export async function fetchMovies(
  path: string,
  limit: number,
  imageSize: BackdropSize,
): Promise<Movie[]> {
  const data = await fetchTmdb<{ results?: TmdbMovie[] }>(path);

  if (!Array.isArray(data.results)) {
    throw new TmdbError(`TMDB devolvió una respuesta sin "results": ${path}`);
  }

  const genres = await fetchGenres();

  return data.results
    .slice(0, limit)
    .map((movie) => toMovie(movie, genres, imageSize));
}

function toMovie(movie: TmdbMovie, genres: Genre[], imageSize: BackdropSize): Movie {
  const title = movie.title?.trim() || movie.name?.trim() || "Sin título";
  const rating = typeof movie.vote_average === "number" ? movie.vote_average : 0;

  return {
    id: String(movie.id),
    title,
    overview: movie.overview?.trim() ?? "",
    releaseLabel: formatShortDate(movie.release_date),
    ratingLabel: rating > 0 ? rating.toFixed(1) : "N/A",
    genreLabel: resolveGenreLabel(movie.genre_ids, genres),
    image: movie.backdrop_path
      ? `${IMAGE_BASE}/${imageSize}${movie.backdrop_path}`
      : FALLBACK_IMAGE,
    trailerUrl: trailerSearchUrl(title),
    isLocal: false,
  };
}
