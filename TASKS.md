# MVP Task Breakdown

## Phase 1: Project Setup

### 1.1 Initialize Astro Project with Tailwind

**Files to create:**

- `package.json`
- `astro.config.mjs`
- `tailwind.config.cjs`
- `tsconfig.json`
- `.prettierrc`
- `.gitignore`
- `src/layouts/BaseLayout.astro`
- `src/pages/index.astro`

**Acceptance Criteria:**

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts dev server on localhost:4321
- [ ] Tailwind classes work in `.astro` files
- [ ] TypeScript strict mode enabled
- [ ] Prettier formats on save

**Effort:** Small  
**Dependencies:** None

---

### 1.2 Set Up Cloudflare Pages Deployment

**Files to create:**

- `wrangler.toml` (optional, for local testing)
- `.github/workflows/deploy.yml` (if needed)

**Acceptance Criteria:**

- [ ] Cloudflare Pages project created
- [ ] Auto-deploys on push to `main`
- [ ] Preview deployments for PRs
- [ ] Production URL accessible

**Effort:** Small  
**Dependencies:** 1.1

---

### 1.3 Configure Build Pipeline

**Files to create:**

- `scripts/build-index.py`
- `src/types/index.ts`
- `src/data/dictionary.jsonl` (sample data)

**Acceptance Criteria:**

- [ ] `npm run build` generates static output in `dist/`
- [ ] Sample JSONL file loads correctly
- [ ] Build time < 30 seconds for 1000 entries

**Effort:** Small  
**Dependencies:** 1.1

---

## Phase 2: Data Pipeline

### 2.1 Research and Fetch Hindi Dictionary Data from Wiktionary

**Files to create:**

- `scripts/fetch-wiktionary.py`
- `scripts/requirements.txt`
- `data/raw/wiktionary_dump.jsonl`

**Acceptance Criteria:**

- [ ] Script downloads latest Hindi entries from Wiktionary
- [ ] Parses word, transliteration, definitions, part of speech
- [ ] Handles rate limiting (respects API limits)
- [ ] Produces valid JSONL output
- [ ] Logs errors for malformed entries

**Effort:** Medium  
**Dependencies:** 1.3

---

### 2.2 Create Transliteration Normalizer

**Files to create:**

- `scripts/normalize-translit.py`
- `scripts/transliteration_map.json`
- `tests/test_normalizer.py`

**Acceptance Criteria:**

- [ ] Normalizes variations: `namaste`/`namastey`/`namasté` → `namaste`
- [ ] Handles: `sh/chh`, `ee/i`, `oo/u`, `a/aa`
- [ ] Maps common Roman spellings to standard transliteration
- [ ] Unit tests cover 20+ edge cases
- [ ] Performance: < 1ms per word

**Effort:** Medium  
**Dependencies:** None (parallel with 2.1)

---

### 2.3 Build Search Index Generator

**Files to create:**

- `scripts/build-index.py` (update)
- `src/data/search-index.json` (generated)
- `src/data/dictionary.jsonl` (normalized output)

**Acceptance Criteria:**

- [ ] Creates inverted index: `transliteration → [words]`
- [ ] Creates meaning index: `English definition → [words]`
- [ ] JSON output < 500KB for 5000 entries (uncompressed)
- [ ] Build script runs in < 10 seconds
- [ ] Handles duplicate entries (merge definitions)

**Effort:** Medium  
**Dependencies:** 2.1, 2.2

---

## Phase 3: Core Features

### 3.1 Implement Client-Side Search with Fuse.js

**Files to create:**

- `src/lib/search.ts`
- `src/data/search-index.json` (load)
- `tests/search.test.ts`

**Acceptance Criteria:**

- [ ] Fuse.js configured with fuzzy threshold 0.3
- [ ] Searches Devanagari, transliteration, and English
- [ ] Returns results within 50ms for 5000 entries
- [ ] Ranks exact matches above fuzzy matches
- [ ] Unit tests for search scenarios

**Effort:** Medium  
**Dependencies:** 2.3

---

### 3.2 Create Search UI (Jisho-style)

**Files to create:**

- `src/components/SearchBox.tsx`
- `src/components/ResultList.astro`
- `src/components/ResultItem.astro`
- `src/styles/search.css`

**Acceptance Criteria:**

- [ ] Search input accepts Devanagari, Roman, English
- [ ] Results appear as user types (debounced 150ms)
- [ ] Shows "No results" with tips when empty
- [ ] Mobile-responsive (works on 320px width)
- [ ] Accessible: keyboard navigation, ARIA labels
- [ ] Shows max 20 results, "Load more" for additional

**Effort:** Medium  
**Dependencies:** 3.1

---

### 3.3 Build Word Detail Pages

**Files to create:**

- `src/pages/word/[word].astro`
- `src/components/EntryDisplay.astro`
- `src/components/DefinitionList.astro`

**Acceptance Criteria:**

- [ ] URL format: `/word/नमस्ते` (URL-encoded)
- [ ] Displays: Devanagari word (large), transliteration
- [ ] Shows all definitions grouped by part of speech
- [ ] 404 page for non-existent words
- [ ] SEO meta tags (title, description)
- [ ] Pre-rendered for top 1000 words

**Effort:** Medium  
**Dependencies:** 3.2

---

## Summary

| Phase            | Tasks | Total Effort |
| ---------------- | ----- | ------------ |
| 1. Project Setup | 3     | Small        |
| 2. Data Pipeline | 3     | Medium       |
| 3. Core Features | 3     | Medium       |

**Total MVP Effort:** ~3-4 weeks for solo developer

## Critical Path

```
1.1 → 1.2 → 1.3 → 2.1 → 2.3 → 3.1 → 3.2 → 3.3
              ↓
            2.2 ──────────→ 2.3
```

## Risk Mitigation

| Risk                       | Mitigation                      |
| -------------------------- | ------------------------------- |
| Wiktionary API limits      | Cache dumps locally, run weekly |
| Transliteration edge cases | Crowdsourced corrections later  |
| Large search index         | Chunking, lazy loading          |
| Devanagari font rendering  | Fallback fonts, preload         |
