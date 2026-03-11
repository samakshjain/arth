# Technical Plan: Hindi Dictionary

## Architecture Overview

Static site with client-side search for zero server costs and instant performance.

┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Static HTML │────▶│ Client-side JS │────▶│ Indexed JSON │
│ (Pre-rendered)│ │ (Fuzzy Search) │ │ (Dictionary) │
└─────────────────┘ └──────────────────┘ └─────────────────┘
│ │
└───────────────────────────────────────────────┘
(Build-time data processing)

## Technology Stack

| Component         | Choice                             | Rationale                                            |
| ----------------- | ---------------------------------- | ---------------------------------------------------- |
| **Framework**     | **Astro**                          | Zero-JS by default, partial hydration, excellent SSG |
| **Search**        | **Fuse.js** or **Minisearch**      | Client-side fuzzy matching, small bundle (~6KB)      |
| **Styling**       | **Tailwind CSS**                   | Utility-first, purged to ~10KB                       |
| **Data**          | **JSONL** (newline-delimited JSON) | Streaming-friendly, git-diffable                     |
| **Hosting**       | **Cloudflare Pages**               | Free, global CDN, edge functions if needed later     |
| **Data Pipeline** | Python scripts                     | Source aggregation, transliteration indexing         |

## Data Structure

### Source Format (JSONL)

{"word": "नमस्ते", "transliteration": "namaste", "definitions": [{"pos": "interjection", "meaning": "hello/greetings"}], "examples": []}
{"word": "चम्मच", "transliteration": "chammach", "definitions": [{"pos": "noun", "meaning": "spoon"}], "examples": ["एक चम्मच चीनी"]}

### Search Index (Generated at build)

{
"index": {
"namaste": ["नमस्ते"],
"namastey": ["नमस्ते"],
"hello": ["नमस्ते", "हैलो"],
"spoon": ["चम्मच", "चमचा"]
}
}

## Build Pipeline

1. **Data Collection** (Python)
   - Scrape/aggregate from open sources (Wiktionary, Shabdkosh)
   - Normalize transliterations (handle sh/ś/ṣ variations)
   - Generate fuzzy index keys

2. **Index Generation** (Build step)
   - Create inverted index: transliteration → word
   - Create meaning index: English → word
   - Compress with gzip/brotli

3. **Static Generation** (Astro)
   - Pre-render top 1000 words as individual pages (/word/[slug])
   - Generate search page with embedded index chunk

## Search Implementation Strategy

**Phase 1: Client-side only**

- Load ~500KB search index on first visit (cached)
- Fuse.js handles fuzzy transliteration matching
- English meanings searched via secondary index

**Phase 2: Edge functions** (if index grows &gt;2MB)

- Cloudflare Worker for search API
- KV store for index shards
- Still static frontend

## Performance Targets

- **First Contentful Paint**: &lt; 1.0s
- **Time to Interactive**: &lt; 1.5s
- **Search latency**: &lt; 50ms (client-side)
- **Total bundle**: &lt; 100KB (excluding data)
- **Data transfer**: ~200KB compressed index

## Cost Optimization

| Strategy                              | Savings           |
| ------------------------------------- | ----------------- |
| Static hosting (Cloudflare Pages)     | $0/month          |
| Client-side search (no server)        | $0 compute        |
| JSONL over API database               | No query costs    |
| Aggressive caching (immutable assets) | Minimal bandwidth |

## Data Sources (Research Needed)

Potential sources for Hindi dictionary data:

- **Wiktionary dump** (CC BY-SA): Structured, reliable, requires parsing
- **Shabdkosh** (scraping TOS check needed)
- **CFILT IIT Bombay resources**: Academic, possibly open
- **Custom crowdsourcing**: Long-term, start with seed data

## File Structure

src/
├── pages/
│ ├── index.astro # Search homepage
│ ├── word/[word].astro # Individual entry pages
│ └── about.astro
├── components/
│ ├── SearchBox.jsx # Hydrated search component
│ └── EntryDisplay.astro
├── data/
│ ├── dictionary.jsonl # Source data (git-lfs)
│ └── search-index.json # Generated index
scripts/
├── fetch-wiktionary.py # Data pipeline
├── build-index.py # Index generator
└── normalize-translit.py # Transliteration standardizer

## Deployment

1. Push to GitHub
2. Cloudflare Pages auto-builds on commit
3. Data updates via scheduled GitHub Actions (weekly)
4. Branch previews for testing data changes
