# AGENTS.md — Guía de proyecto y traspaso

> **Para qué sirve este archivo:** es la fuente de verdad para que **cualquier persona, máquina,
> harness o IA** entienda el proyecto sin contexto previo. Si eres un agente, léelo completo antes de
> tocar código. Si eres humano, úsalo como onboarding técnico.
>
> Idioma del proyecto: **español** (UI, textos y commits). Este documento también está en español.
> Última verificación del repo: **octubre 2026** (`pnpm check` = 0 errores, 0 avisos, 0 hints;
> `pnpm build` = 5 páginas).

---

## 1. Resumen del proyecto

| Campo | Valor |
| --- | --- |
| Nombre | **Cinerama — Re-Imaginado** |
| Qué es | Re-imaginación no oficial de la cartelera de Cinerama Perú |
| Tipo | Sitio **estático** (SSG), sin backend ni runtime de servidor |
| Framework | **Astro 5** (`^5.13.11`) con `ClientRouter` (view transitions) |
| Estilos | **Tailwind CSS v4** (`^4.1.13`) vía `@tailwindcss/vite` — **sin `tailwind.config.js`** |
| Datos de películas | **TMDB API v3** (fetch en build time) |
| Datos de cines | `src/data/cines.json` (estático) |
| Gestor de paquetes | **pnpm** (`packageManager: pnpm@12.9.1`) — no usar npm/yarn |
| Salida | `dist/` (HTML/CSS/JS estáticos) |
| Deploy | **Vercel** (detección automática; no hay `vercel.json`) |
| URL de producción | https://cinerama-seven.vercel.app |
| Repositorio | https://github.com/RaiderMr3003/Cinerama |
| Autor | RaiderMr3003 |
| Lint / formato / tests / CI | **No existen** (verificación = `pnpm check` + `pnpm build`) |

### Aviso legal
Este sitio **no es oficial**. La web oficial de los cines es https://www.cinerama.com.pe/.
Los datos e imágenes de películas provienen de **TMDB** (se muestra atribución en el footer).

---

## 2. Requisitos previos

- **Node.js 20+** (probado con versiones modernas de Node 22/24).
- **pnpm 12.x** (o `corepack enable` para respetar `packageManager`).
- Un **token de lectura de TMDB** (ver sección 4). Sin él, `dev` y `build` fallan.

> Nota Windows: si en la consola ves caracteres `�` en archivos con acentos, suele ser el terminal
> (no los archivos, que son UTF-8). Usa `chcp 65001` o una terminal con UTF-8.

---

## 3. Puesta en marcha

```bash
# 1. Dependencias
pnpm install

# 2. Variables de entorno (crear .env a partir del ejemplo)
#    y pegar el token de TMDB
cp .env.example .env      # Windows: Copy-Item .env.example .env

# 3. Servidor de desarrollo
pnpm dev                  # http://localhost:4321

# 4. Verificar antes de dar por terminado un cambio
pnpm check                # astro check: 0 errores esperado
pnpm build                # genera dist/ : 5 páginas esperado
```

---

## 4. Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | **Sí** | Read Access Token de TMDB (v4). Se envía como `Authorization: Bearer ...`. |

- Se crea `.env` (y opcionalmente `.env.production`); **ambos están gitignoreados**.
- `.env.example` es la plantilla versionada.
- Se obtiene en: https://www.themoviedb.org/settings/api
- Se accede en el código como `import.meta.env.TMDB_ACCESS_TOKEN`.
- **Si falta el token:** los `fetch` a TMDB devuelven error y el build falla (no hay fallback).

---

## 5. Comandos

| Comando | Acción |
| --- | --- |
| `pnpm install` | Instala dependencias |
| `pnpm dev` | Servidor de desarrollo en `localhost:4321` |
| `pnpm build` | Build de producción a `./dist/` |
| `pnpm preview` | Sirve el build localmente |
| `pnpm check` | Type-check con `astro check` (usa `astro/tsconfigs/strict`) |
| `pnpm astro ...` | CLI de Astro (`astro add`, `astro check`, etc.) |

---

## 6. Arquitectura y flujo de datos

Sitio **100% estático**. Todo el fetch a TMDB ocurre **en build time**, dentro del *frontmatter*
de los componentes. No hay adapter de SSR ni revalidación en runtime.

```
src/pages/*.astro
      │  (define title / description y compone contenido)
      ▼
src/layouts/Layout.astro      ← head SEO, <Header>, <main>, <Footer>, ClientRouter
      │
      ├── index.astro    → <Hero /> (HeroAPI.astro, Swiper)  +  <Cines /> (Cines.astro)
      └── estrenos/popular/proximo/ranking → <MoviesSection /> (fetchUrl por página)
```

- **`Layout.astro`** envuelve todas las páginas: meta tags, canonical, Open Graph, JSON-LD, skip link,
  `Header`, `<main id="main-content">` y `Footer`.
- **`HeroAPI.astro`** (solo en la portada) hace 2 fetch: *trending* de la semana y lista de géneros.
  Se movió fuera del Layout para no duplicar el fetch en cada página.
- **`MoviesSection.astro`** recibe `fetchUrl` por props y renderiza la grilla; también pide géneros.
- **`Cines.astro`** no usa API: lee `src/data/cines.json` y mapea imágenes locales.

### Endpoints de TMDB usados

| Componente | Endpoint |
| --- | --- |
| HeroAPI | `GET /3/trending/movie/week?language=es-ES` |
| MoviesSection | `GET /3/movie/now_playing?language=es-ES&page=1&region=PE` (Estrenos) |
| MoviesSection | `GET /3/movie/popular?language=es-ES&page=1&region=PE` (Populares) |
| MoviesSection | `GET /3/movie/upcoming?language=es-ES&page=1&region=PE` (Próximamente) |
| MoviesSection | `GET /3/movie/top_rated?language=es-ES&page=1&region=PE` (Ranking / Top 20) |
| Ambos | `GET /3/genre/movie/list?language=es-ES` (para traducir `genre_ids`) |

Todas las peticiones envían `Authorization: Bearer ${import.meta.env.TMDB_ACCESS_TOKEN}`.

---

## 7. Mapa de archivos

| Ruta | Rol |
| --- | --- |
| `astro.config.mjs` | Config de Astro: plugin Tailwind, `image.service` **noop**, `site`, integración sitemap |
| `package.json` | Scripts (`dev/build/preview/astro/check`) y dependencias |
| `pnpm-workspace.yaml` | `allowBuilds` para pnpm v12 (`@tailwindcss/oxide`, `esbuild`, `sharp`) |
| `tsconfig.json` | Extiende `astro/tsconfigs/strict` |
| `.env.example` | Plantilla de variables de entorno |
| `public/` | `favicon.svg`, `og-cinerama.jpg`, `robots.txt` |
| `src/layouts/Layout.astro` | Chrome común + SEO + a11y (skip link, main, JSON-LD) |
| `src/components/Header.astro` | Nav fija; menú móvil accesible con `<button aria-expanded>` + script (foco, Escape, scroll lock, `aria-current`) |
| `src/components/Footer.astro` | Atribución (TMDB, aviso no oficial) y link a GitHub |
| `src/components/HeroAPI.astro` | Swiper del hero (portada) con datos de TMDB |
| `src/components/MoviesSection.astro` | Grilla reutilizable de películas (recibe `fetchUrl`) |
| `src/components/Cines.astro` | Sección de cines + tarjetas desde `cines.json` |
| `src/components/AvisoDegradado.astro` | Banner "Datos de muestra" cuando TMDB no responde |
| `src/lib/tmdb.ts` | Integración con TMDB: token, errores de red/HTTP, normalización a `Movie` |
| `src/lib/movies.ts` | `getMovieList()`: TMDB primero; si falla, respaldo local (solo en `dev`) |
| `src/pages/index.astro` | `/` → Hero + Cines |
| `src/pages/estrenos.astro` | `/estrenos` (now_playing) |
| `src/pages/popular.astro` | `/popular` (popular) |
| `src/pages/proximo.astro` | `/proximo` (upcoming) |
| `src/pages/ranking.astro` | `/ranking` (top_rated) |
| `src/data/cines.json` | **Usado**: cines (nombre, dirección, `img`, `orden`, `url`, `ubicacion`) |
| `src/data/movies.json` | **Usado como respaldo local**: 6 películas de muestra si TMDB falla en `dev` |
| `src/styles/global.css` | `@import "tailwindcss"`, `@theme` con los tokens de diseño (rojo/oro/neutros), foco visible, movimiento reducido global y estilos del menú móvil |
| `src/assets/*.webp` | Cines (11) + logo + logo TMDB + 6 películas de respaldo. Solo `cinerama.webp` sigue sin uso |

### Rutas y anclas de navegación
| Ruta | Sección (`idsection`) | Ancla en menú |
| --- | --- | --- |
| `/` | `cines` | `/#cines` |
| `/estrenos` | `encines` | `/estrenos#encines` |
| `/popular` | `top` | `/popular#top` |
| `/proximo` | `proximamente` | `/proximo#proximamente` |
| `/ranking` | `rank` | `/ranking#rank` |

---

## 8. Convenciones de código

- **Astro + Tailwind v4**: no hay `tailwind.config.js`. El tema/variables van en
  `src/styles/global.css` con la sintaxis v4 (`@theme`, `@tailwindcss/vite`).
- **Paleta**: usar los tokens de `@theme` (`cine-rojo`, `cine-rojo-vivo`, `cine-rojo-hondo`,
  `cine-oro`, `cine-humo`, `cine-borde`, `cine-carbon`) y no colores Tailwind sueltos. Regla:
  **oro** = valoración y acción primaria, **rojo** = marca/hover/acento, **neutros** = estructura.
  Evitar azul/verde/morado/rosa salvo justificación (rompían la identidad del logo).
- **Componentes**: `.astro` en `src/components`; lógica en el *frontmatter*, markup abajo,
  `<style>` scoped al final si hace falta.
- **Tipado**: `astro/tsconfigs/strict`. Los datos de TMDB se tipan como `any` puntualmente
  (`movie: any`, `(id: number)`, `(g: any)`) porque `res.json()` no trae tipos. Evita `any` nuevo
  sin justificación.
- **Headings**: **un solo `<h1>` por página**. Secciones `<h2>`, tarjetas/películas/cines `<h3>`.
- **Imágenes**: `image.service` es **noop** (optimización de Astro desactivada). Los cines usan
  `<Image>` con assets locales; las películas usan `<img>` con URLs del CDN de TMDB.
- **ClientRouter** activo: mantené cualquier `<script>`/tag nuevo compatible con view transitions.
- **Idioma**: textos de UI en español; commits en español, modo imperativo
  (ej.: "Agregar metatag de palabras clave en el layout").
- **Node/prerender**: `export const prerender` / `revalidate` solo tienen efecto en **páginas**
  (no en componentes). No hay SSR, así que no hay revalidación real.

---

## 9. SEO y accesibilidad (estado actual)

Implementado en `Layout.astro` y componentes:

- `<html lang="es">`, `<title>` por página con sufijo `| Cinerama`.
- `meta description` por página; `meta keywords` genérico en el Layout.
- `<link rel="canonical">` y `og:url` calculados por página (`Astro.url.pathname`).
- **Open Graph** (`og:title/description/image/type/url`) con `og:image` absoluto.
- **JSON-LD** `Organization` en el `<head>`.
- **Skip link** ("Saltar al contenido" → `#main-content`) visible al enfocar.
- `aria-label` en íconos/enlaces (menú, GitHub), `alt` en imágenes.
- `prefers-reduced-motion`: se desactiva el scroll suave, se **detiene el autoplay** del hero y se
  anulan transiciones/animaciones en **todas** las páginas (regla global en `global.css`).
- `robots.txt` + sitemap (`@astrojs/sitemap` → `sitemap-index.xml`).

---

## 10. Problemas conocidos y trampas (leer antes de depurar)

1. **Extensión Console Ninja (VS Code) — CRÍTICO.**
   La extensión `wallabyjs.console-ninja` **parchea archivos dentro de `node_modules`** (p. ej.
   `astro.js`, `vite.js`, `dist/cli/dev/index.js`) y también **el pnpm store**. Síntoma: la CLI de
   Astro (`astro check`, `astro --help`) no imprime nada o solo "Console Ninja extension is
   connected". **Recomendación: desactivarla/desinstalarla.** Recuperación en Windows:

   ```powershell
   Stop-Process -Name node -Force -ErrorAction SilentlyContinue
   Remove-Item node_modules -Recurse -Force
   Remove-Item "$env:LOCALAPPDATA\pnpm\store\v11" -Recurse -Force   # ruta devuelta por: pnpm store path
   pnpm install
   pnpm check
   pnpm build
   ```

2. **TypeScript debe ser 5.x.** `@astrojs/check` se rompe con TypeScript 7 (puerto nativo).
   Mantener `typescript@~5.9.3`. Si `astro check` pide instalar `@astrojs/check`, ya está en
   `devDependencies`; no responder el prompt interactivo, usar `pnpm check`.

3. **Token de TMDB**: gestionado en `src/lib/tmdb.ts`. En `pnpm dev` sin token válido se usan
   **datos locales de muestra** con un banner "Datos de muestra" y un `console.warn` con la causa.
   En `pnpm build` (producción) **falla a propósito** con un mensaje claro, para que Vercel
   conserve el último despliegue correcto en vez de publicar muestras.

4. **`image.service` = noop**: no esperes optimización de `<Image>`/`<Picture>`. Los `src` de TMDB
   ya se piden en tamaño adecuado (`w780`/`w1280`) desde `src/lib/tmdb.ts`.

5. **Tailwind v4**: no crear `tailwind.config.js`; la configuración vive en CSS.

6. **Menú móvil**: es un *disclosure* con JS (`<button id="menu-toggle" aria-expanded aria-controls>`)
   cuyo handler está **delegado en `document`** (una sola vez, compatible con ClientRouter). Hay un
   `<noscript>` que muestra la navegación siempre visible. Si lo tocas, conserva todo esto:
   `aria-expanded`/`aria-label` sincronizados, **`visibility: hidden` al cerrar** (sin eso, los
   enlaces ocultos siguen siendo enfocables), el foco de entrada al abrir, la **trampa de foco**,
   `Escape` que devuelve el foco al botón y el bloqueo de scroll (`html.menu-open`).

7. **Código/imágenes sin uso**: `movies.json` y las 6 imágenes de películas **sí se usan** ahora
   (respaldo local, ver `src/lib/movies.ts`). Único asset sin uso conocido: `src/assets/cinerama.webp`.

8. **Sin lint/formato/tests/CI.** Cualquier verificación manual es `pnpm check` + `pnpm build`.

9. **`.agents/` y `skills-lock.json` están gitignoreados**: son skills locales del agente, no se
   comparten por git. Este `AGENTS.md` **sí** se versiona (a propósito).

---

## 11. Reglas para agentes / IA

Checklist para cualquier cambio:

- [ ] Usar **pnpm** (nunca npm/yarn; no crear `package-lock.json`).
- [ ] Ejecutar **`pnpm check`** (0 errores) y **`pnpm build`** (5 páginas) antes de terminar.
- [ ] No commitear `.env` / `.env.production`.
- [ ] No crear `tailwind.config.js`.
- [ ] Mantener **un solo `<h1>`** por página y la jerarquía de headings.
- [ ] Escribir textos de UI en **español** y respetar el diseño oscuro existente.
- [ ] Mantener compatibilidad con **ClientRouter**.
- [ ] No introducir SSR/adapter: el sitio es y debe seguir siendo estático.
- [ ] Si se edita contenido de TMDB, no romper el tipado `any` acotado existente ni los endpoints.

---

## 12. Roadmap / mejoras priorizadas

Ordenado por impacto. (Sugerencias, no obligaciones.)

### P1 — Rendimiento y robustez técnica
- [x] **Imágenes de TMDB en tamaño adecuado** (`w780` grillas / `w1280` hero) — hecho: −86%/−94% de payload.
- [x] **`loading="lazy"`** fuera del hero + `width`/`height` — hecho.
- [x] **Manejo de token ausente / errores de API** — hecho en `src/lib/tmdb.ts` + respaldo local en `dev`.
- [ ] **Base de datos de cines**: `cines.json` tiene `ubigeo`/`cc`/`estado` quizá sin uso; validar.

### P2 — SEO y accesibilidad
- [x] **Menú móvil accesible** — hecho: `<button aria-expanded>`, Escape, trampa de foco, scroll lock.
- [x] **Contraste** — hecho: 13 pares de la paleta verificados (todos AA); foco visible global.
- **Carrusel (WCAG 2.2.2)**: pausar autoplay al hacer hover/enfocar y ofrecer control de pausa;
  `aria-label` en botones prev/next.
- **JSON-LD por contenido**: `ItemList`/`Movie` en las páginas y `og:image` por película.
- **`sitemap`**: confirmar `changefreq`/`priority` si se desea.
- **Enlaces externos**: valorar avisar "(se abre en una pestaña nueva)" en los 22 enlaces a cines.

### P3 — Producto
- Página de **detalle de película** (`/pelicula/[id]`).
- **Búsqueda** de películas.
- **Horarios reales** de Cinerama (hoy solo se enlaza a `cinerama.com.pe`).
- **Internacionalización** (hoy fijo `es-ES`).
- **PWA / offline** (opcional).

### P4 — Infraestructura y calidad
- **CI con GitHub Actions**: `pnpm install` → `pnpm check` → `pnpm build`.
- **Lint/format**: Prettier o Biome (no hay nada hoy).
- **Dependencias**: evaluar Dependabot/Renovate.
- **Limpieza**: validar si `cines.json` necesita los campos `ubigeo`/`cc`/`estado` (P1).
  `movies.json` **ya no es desechable**: es el respaldo local de la Etapa 2.

---

## 13. Despliegue

- **Vercel**, build estático. Build command: `pnpm build`. Output: `dist/`.
- Definir `TMDB_ACCESS_TOKEN` en las **Environment Variables del proyecto en Vercel**
  (no se puede construir sin el token).
- `site` en `astro.config.mjs` = `https://cinerama-seven.vercel.app`; de ahí salen canonical y
  sitemap. Si cambia el dominio, actualizar `site` y `public/robots.txt`.

---

## 14. Contexto histórico reciente (para continuidad)

Una sesión previa de hardening dejó el repo así (commits en `main`):

1. Un solo gestor de paquetes (**pnpm**), `allowBuilds` en `pnpm-workspace.yaml`, `package-lock.json`
   eliminado.
2. `.env` + `.env.example` para `TMDB_ACCESS_TOKEN`.
3. `pnpm check` configurado (`@astrojs/check` + TypeScript 5.9) → 0 errores.
4. `HeroAPI` movido a la portada (no en el Layout) para evitar fetch duplicado.
5. Corregido HTML inválido del Header (`<button>` dentro de `<a>`), `rel`, `aria-label`.
6. Eliminados `prerender`/`revalidate` no-op de `HeroAPI`/`MoviesSection`.
7. SEO/a11y: canonical, `og:url`, JSON-LD, jerarquía de headings, títulos con `| Cinerama`.
8. Skip link + `prefers-reduced-motion` (scroll y autoplay del hero).
9. README ampliado (stack, setup, comandos, estructura, SEO/a11y).

---

## 15. Verificación rápida (definition of done)

```bash
pnpm check    # esperado: 0 errors, 0 warnings, 0 hints
pnpm build    # esperado: 5 page(s) built ... Complete!
```

Comprobación puntual del menú móvil (sin tocar el repo): cargar `dist/index.html` en un navegador
a 390 px y verificar que el botón alterna `aria-expanded`, que `Escape` devuelve el foco y que los
enlaces del menú cerrado no se alcanzan con Tab.

Si algo de esto no cuadra, revisa la sección 10 (gotchas) antes de tocar código.
