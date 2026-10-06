<div align="center">
<img src="public/favicon.svg" height="50px" width="auto" /> 
<h3>
Cinerama - Re-Imaginado
</h3>
<p>Creado para mejorar mis habilidades.</p>
</div>

<div align="center">
    <a href="https://cinerama-seven.vercel.app/" target="_blank">
        Preview
    </a>
    <span>&nbsp;✦&nbsp;</span>
    <a href="#-commands">
        Commands
    </a>
    <span>&nbsp;✦&nbsp;</span>
    <a href="https://github.com/RaiderMr3003">
        GitHub
    </a>
</div>

<p></p>

<div align="center">

![Astro Badge](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=fff&style=flat)
![HTML Bagde](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![JavaScript Badge](https://img.shields.io/badge/JavaScript-323330?style=flat&logo=javascript&logoColor=F7DF1E)
![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff&style=flat)
![GitHub stars](https://img.shields.io/github/stars/RaiderMr3003/Cinerama)

</div>

> [!WARNING]
> Esta página no es oficial. La página oficial es [**cinerama.com.pe**](https://www.cinerama.com.pe/).

## 🛠 Tech Stack

- **Astro 5** — sitio estático (SSG), con `ClientRouter` para transiciones entre páginas
- **Tailwind CSS v4** — vía `@tailwindcss/vite` (sin `tailwind.config.js`; estilos globales en `src/styles/global.css`)
- **@lucide/astro** — íconos
- **astro-swiper** — carousel del hero
- **@astrojs/sitemap** — sitemap automático
- **TMDB API** — datos de películas (v3), en español (`es-ES`) y región `PE`

## 🚀 Setup

1. Instala dependencias:

   ```bash
   pnpm install
   ```

2. Crea `.env` a partir de `.env.example` y agrega tu token de TMDB:

   ```bash
   TMDB_ACCESS_TOKEN=tu_token_aqui
   ```

   El token se obtiene en [TMDB](https://www.themoviedb.org/settings/api) (Read Access Token). Sin él,
   `pnpm dev` y `pnpm build` fallan al hacer fetch a la API.

3. Inicia el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm check`           | Type-check with `astro check`                    |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 📁 Estructura del proyecto

```text
src/
├── assets/        # Imágenes locales (webp, svg) importadas por componentes
├── components/    # Header, Footer, HeroAPI (swiper TMDB), Cines, MoviesSection
├── data/          # cines.json y movies.json (datos estáticos de salas/películas)
├── layouts/       # Layout.astro (head SEO, Header, Footer, slot)
├── pages/         # index, estrenos, popular, proximo, ranking
└── styles/        # global.css (import de tailwind)
public/            # favicon, og image, robots.txt
```

- **Página → Layout → Componente**: cada página en `src/pages` define `title`/`description` y
  delega el contenido en `MoviesSection` o `Cines`.
- El hero (`HeroAPI`) solo se usa en la portada para evitar un fetch duplicado en cada build.
- `MoviesSection` recibe `fetchUrl` de TMDB y renderiza la grilla de películas.

## 🔍 SEO & Accesibilidad

- Canonical URL y `og:url` por página, título con sufijo `| Cinerama`.
- JSON-LD (`Organization`) en el `<head>`.
- Headings jerárquicos (un solo `<h1>` por página, `<h2>` para secciones/películas).
- `alt` en imágenes, `aria-label` en íconos y `lang="es"` en el `<html>`.
- `robots.txt` + sitemap en `@astrojs/sitemap`.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
