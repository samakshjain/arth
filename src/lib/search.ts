import Fuse from 'fuse.js';
import type { DictionaryEntry, SearchResult } from '@/types';

// Fuse.js search options
const FUSE_OPTIONS = {
  keys: [
    { name: 'word', weight: 0.2 },
    { name: 'transliteration', weight: 0.25 },
    { name: 'definitions.meaning', weight: 0.55 },
  ],
  threshold: 0.25,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: false,
  useExtendedSearch: true,
  shouldSort: true,
  distance: 100,
};

// Chunk loading state
let fuseInstance: Fuse<DictionaryEntry> | null = null;
let dictionaryData: DictionaryEntry[] = [];
let loadedChunks: Set<string> = new Set();
let chunkManifest: { chunks: string[] } | null = null;

/**
 * Get the first character of a string (handles Devanagari)
 */
function getFirstChar(text: string): string {
  if (!text) return 'other';
  const char = text[0].toLowerCase();
  if (/[\u0900-\u097F]/.test(char) || /[a-z]/.test(char)) {
    return char;
  }
  return 'other';
}

/**
 * Load chunk manifest
 */
async function loadManifest(): Promise<{ chunks: string[] }> {
  if (chunkManifest) return chunkManifest;

  const response = await fetch('/data/chunks/manifest.json');
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status}`);
  }

  chunkManifest = await response.json();
  return chunkManifest!;
}

/**
 * Load uncompressed chunk
 */
async function loadUncompressedChunk(chunkChar: string): Promise<DictionaryEntry[]> {
  const response = await fetch(`/data/chunks/dict_${chunkChar}.jsonl`);
  if (!response.ok) {
    console.warn(`Chunk ${chunkChar} not found`);
    return [];
  }
  const text = await response.text();
  const entries = parseDictionaryJSONL(text);
  loadedChunks.add(chunkChar);
  return entries;
}

/**
 * Parse dictionary JSONL format
 */
function parseDictionaryJSONL(text: string): DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const entry = JSON.parse(trimmed) as DictionaryEntry;
      entries.push(entry);
    } catch {
      continue;
    }
  }

  return entries;
}

/**
 * Initialize search with relevant chunks based on query
 */
export async function initSearch(query?: string): Promise<void> {
  if (fuseInstance && !query) return;

  try {
    const manifest = await loadManifest();

    if (!query) {
      for (const chunk of manifest.chunks) {
        if (!loadedChunks.has(chunk)) {
          const entries = await loadUncompressedChunk(chunk);
          dictionaryData.push(...entries);
        }
      }
    } else {
      const normalizedQuery = query.toLowerCase().trim();
      const firstChar = getFirstChar(normalizedQuery);

      if (!loadedChunks.has(firstChar)) {
        const entries = await loadUncompressedChunk(firstChar);
        dictionaryData.push(...entries);
      }

      const commonChunks = ['क', 'प', 'स', 'न', 'म', 'ब'];
      for (const chunk of commonChunks) {
        if (!loadedChunks.has(chunk) && chunk !== firstChar) {
          const entries = await loadUncompressedChunk(chunk);
          dictionaryData.push(...entries);
        }
      }
    }

    fuseInstance = new Fuse(dictionaryData, FUSE_OPTIONS);
  } catch (error) {
    console.error('Failed to initialize search:', error);
    throw error;
  }
}

/**
 * Search the dictionary
 */
export function search(query: string): SearchResult[] {
  if (!fuseInstance) {
    throw new Error('Search not initialized. Call initSearch() first.');
  }

  if (!query || query.length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results = fuseInstance.search(normalizedQuery);

  return results.map((result) => ({
    word: result.item.word,
    transliteration: result.item.transliteration,
    iast: result.item.iast,
    definitions: result.item.definitions,
    score: result.score ?? 1,
  }));
}

/**
 * Calculate length penalty for search results
 */
function calculateLengthPenalty(query: string, text: string): number {
  const queryLen = query.length;
  const textLen = text.length;

  if (textLen < queryLen - 1) {
    return 0.5;
  }

  if (textLen > queryLen * 2) {
    return 0.1;
  }

  return 0;
}

/**
 * Search with improved ranking
 */
export function searchWithExactPriority(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryLen = normalizedQuery.length;
  const results = search(query);

  const scoredResults = results
    .map((result) => {
      let baseScore = result.score ?? 1;
      const translitLower = result.transliteration.toLowerCase();
      const iastLower = result.iast.toLowerCase();

      if (translitLower.length < queryLen - 1 && iastLower.length < queryLen - 1) {
        return { ...result, adjustedScore: 10 };
      }

      const transPenalty = calculateLengthPenalty(normalizedQuery, translitLower);
      const iastPenalty = calculateLengthPenalty(normalizedQuery, iastLower);
      const bestPenalty = Math.min(transPenalty, iastPenalty);

      const isExactTrans = translitLower === normalizedQuery;
      const isExactIast = iastLower === normalizedQuery;
      const isPrefixMatch =
        translitLower.startsWith(normalizedQuery) || iastLower.startsWith(normalizedQuery);

      let boost = 0;
      if (isExactTrans || isExactIast) {
        boost = -0.3;
      } else if (isPrefixMatch) {
        boost = -0.15;
      }

      return {
        ...result,
        adjustedScore: baseScore + bestPenalty + boost,
      };
    })
    .filter((r) => r.adjustedScore < 5)
    .sort((a, b) => a.adjustedScore - b.adjustedScore);

  return scoredResults.map(({ adjustedScore, ...result }) => ({
    ...result,
    score: result.score,
  }));
}

/**
 * Quick check if search is ready
 */
export function isSearchReady(): boolean {
  return fuseInstance !== null && dictionaryData.length > 0;
}

/**
 * Get total number of loaded entries
 */
export function getEntryCount(): number {
  return dictionaryData.length;
}

/**
 * Get all loaded entries
 */
export function getAllEntries(): DictionaryEntry[] {
  return dictionaryData;
}
