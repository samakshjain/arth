# Hindi Dictionary Agent Guide

## Why

Clean, fast Hindi-English dictionary (Jisho.org style). No ads, no clutter.
Static site with client-side fuzzy search.

## What (project map)

- `src/` - Astro source code
- `scripts/` - Python data pipeline
- `data/` - Dictionary JSONL files
- `specs/` - Functional and technical specifications

## How (always apply)

- Use Astro framework with minimal JavaScript
- Client-side search via Fuse.js or Minisearch
- Host on Cloudflare Pages (unlimited bandwidth)
- Keep bundle size <100KB
- No server-side rendering for search (static only)

## Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Type checking
npm run typecheck

# Run all checks (lint + typecheck + test)
npm run check
```

## Deployment

This project deploys to **Cloudflare Pages** via GitHub Actions.

### Setup Required (One-time)

1. **Create Cloudflare Pages Project:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project" → Connect to Git
   - Select this repository
   - Project name: `arth`

2. **Add Repository Secrets:**
   In GitHub repo → Settings → Secrets and variables → Actions, add:
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (from dashboard)
   - `CLOUDFLARE_API_TOKEN`: Create at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with:
     - Zone:Read
     - Page Rules:Read
     - Cloudflare Pages:Edit

### Deployment Behavior

- **Production:** Auto-deploys on push to `main` branch
- **Preview:** Deploys for every Pull Request (unique URL)
- **Build output:** Static files from `dist/` directory

### Local Testing with Wrangler

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Preview build locally
npm run build
wrangler pages dev dist
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a single test file
npm test -- src/components/SearchBox.test.ts

# Run tests matching a pattern
npm test -- --grep "SearchBox"
```

## Code Style Guidelines

### General Principles

- Use TypeScript for all new code (strict mode enabled)
- Prefer Astro components over React for static content
- Keep client-side JavaScript minimal; use Islands architecture
- Use functional programming patterns where appropriate
- Avoid premature abstraction; favor simple, readable code

### Imports

```typescript
// Order: external libs → internal modules → relative imports → types
import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { type DictionaryEntry } from '../types';
import { searchIndex } from '../data/search-index';
import EntryDisplay from '../components/EntryDisplay.astro';

// Use absolute imports for project modules (configure path aliases in tsconfig)
import { getEntry } from '@/lib/dictionary';
```

### Formatting

- Use Prettier for code formatting (config in `.prettierrc`)
- Line length: 100 characters max
- Use 2 spaces for indentation (no tabs)
- Use single quotes for strings
- Always include trailing commas
- Use semicolons

### TypeScript

```typescript
// Prefer interfaces over types for object shapes
interface DictionaryEntry {
  word: string;
  transliteration: string;
  definitions: Definition[];
  examples?: string[];
}

// Use readonly for immutable data
interface ReadonlyEntry {
  readonly word: string;
  readonly definitions: readonly Definition[];
}

// Avoid 'any'; use 'unknown' when type is truly unknown
function parseEntry(data: unknown): DictionaryEntry {
  if (!isEntry(data)) throw new Error('Invalid entry');
  return data;
}

// Use satisfies for type narrowing
const entry = { word: 'नमस्ते' } as const satisfies DictionaryEntry;
```

### Naming Conventions

- **Files**: kebab-case (e.g., `search-box.astro`, `dictionary-entry.ts`)
- **Components**: PascalCase (e.g., `SearchBox.astro`, `EntryList.tsx`)
- **Functions**: camelCase, use verb prefix (e.g., `getEntry()`, `searchDictionary()`)
- **Variables**: camelCase, descriptive names
- **Constants**: SCREAMING_SNAKE_CASE for config values
- **Types/Interfaces**: PascalCase
- **CSS Classes**: kebab-case (Tailwind utility classes)

### Error Handling

```typescript
// Use custom error classes for domain errors
class DictionaryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'DictionaryError';
  }
}

// Always handle async errors with try/catch
async function fetchEntry(word: string): Promise<Entry> {
  try {
    const entry = await dictionary.get(word);
    if (!entry) throw new DictionaryError('Entry not found', 'NOT_FOUND', 404);
    return entry;
  } catch (error) {
    if (error instanceof DictionaryError) throw error;
    throw new DictionaryError('Failed to fetch', 'INTERNAL_ERROR', 500);
  }
}

// Use Result type for fallible operations
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### Astro Components

```astro
---
// Frontmatter: TypeScript only, no side effects
import type { DictionaryEntry } from '@/types';
import EntryDisplay from './EntryDisplay.astro';

interface Props {
  entry: DictionaryEntry;
  showExamples?: boolean;
}

const { entry, showExamples = false } = Astro.props;
---

<article class="entry">
  <h1 class="text-2xl font-hindi">{entry.word}</h1>
  <p class="text-gray-600">{entry.transliteration}</p>
  <ul>
    {
      entry.definitions.map((def) => (
        <li>
          <EntryDisplay definition={def} />
        </li>
      ))
    }
  </ul>
</article>

<style>
  .entry {
    @apply p-4 rounded-lg shadow;
  }
</style>
```

### Tailwind CSS

- Use utility classes in templates, avoid raw CSS unless necessary
- Use semantic class names for complex components
- Keep custom styles in `<style>` blocks with `@apply` when grouping utilities
- Use design tokens from `tailwind.config.cjs`

### Python (Data Pipeline)

```python
# Follow PEP 8 with Black formatter
# Type hints required for function signatures
from typing import Generator
import json

def parse_jsonl(file_path: str) -> Generator[dict, None, None]:
    """Parse JSONL file line by line."""
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                yield json.loads(line)

# Constants at module level
DEFAULT_ENCODING: str = 'utf-8'
MAX_LINE_LENGTH: int = 10_000
```

### Git Conventions

- Commit messages: imperative mood, 50 chars max for title
- Branch naming: `feature/description`, `fix/description`, `docs/description`
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

### Testing Guidelines

- Use Vitest for unit tests
- Use Playwright for e2e tests
- Test file naming: `*.test.ts` for unit, `*.e2e.ts` for e2e
- Place tests next to source files (colocation)
- Follow AAA pattern: Arrange, Act, Assert
