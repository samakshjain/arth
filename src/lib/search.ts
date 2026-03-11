import Fuse from 'fuse.js';
import type { DictionaryEntry, SearchResult } from '@/types';

// Fuse.js search options
const FUSE_OPTIONS = {
  keys: [
    { name: 'word', weight: 0.4 },
    { name: 'transliteration', weight: 0.35 },
    { name: 'iast', weight: 0.15 },
    { name: 'definitions.meaning', weight: 0.1 },
  ],
  threshold: 0.25,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
  // Penalize matches where the text is much longer than query
  distance: 100,
};

let fuseInstance: Fuse<DictionaryEntry> | null = null;
let dictionaryData: DictionaryEntry[] = [];

/**
 * Initialize the search index with dictionary data.
 * Call this once on app load.
 */
export async function initSearch(): Promise<void> {
  if (fuseInstance) return;

  try {
    const response = await fetch('/data/dictionary.jsonl');
    if (!response.ok) {
      throw new Error(`Failed to load dictionary: ${response.status}`);
    }

    const text = await response.text();
    dictionaryData = parseDictionaryJSONL(text);

    fuseInstance = new Fuse(dictionaryData, FUSE_OPTIONS);
  } catch (error) {
    console.error('Failed to initialize search:', error);
    throw error;
  }
}

/**
 * Parse dictionary JSONL format.
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
      // Skip malformed lines
      continue;
    }
  }

  return entries;
}

/**
 * Search the dictionary.
 * Returns results sorted by relevance (exact matches first).
 */
export function search(query: string): SearchResult[] {
  if (!fuseInstance) {
    throw new Error('Search not initialized. Call initSearch() first.');
  }

  if (!query || query.length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Perform fuzzy search
  const results = fuseInstance.search(normalizedQuery);

  // Transform to SearchResult format with ranking
  return results.map((result) => ({
    word: result.item.word,
    transliteration: result.item.transliteration,
    iast: result.item.iast,
    definitions: result.item.definitions,
    score: result.score ?? 1,
  }));
}

/**
 * Calculate length penalty for search results.
 * Penalizes matches where the matched text is much longer than the query.
 */
function calculateLengthPenalty(query: string, text: string): number {
  const queryLen = query.length;
  const textLen = text.length;

  // If text is shorter than query (minus 1 for typo tolerance), penalize heavily
  if (textLen < queryLen - 1) {
    return 0.5;
  }

  // If text is much longer than query, add small penalty
  if (textLen > queryLen * 2) {
    return 0.1;
  }

  return 0;
}

/**
 * Search with improved ranking.
 * - Filters out results where matched text is too short
 * - Penalizes results where matched text is much longer
 * - Exact matches ranked highest
 */
export function searchWithExactPriority(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryLen = normalizedQuery.length;
  const results = search(query);

  // Score and filter results
  const scoredResults = results
    .map((result) => {
      let baseScore = result.score ?? 1;

      // Check transliteration length vs query
      const translitLower = result.transliteration.toLowerCase();
      const iastLower = result.iast.toLowerCase();

      // Skip if transliteration is significantly shorter than query
      if (translitLower.length < queryLen - 1 && iastLower.length < queryLen - 1) {
        return { ...result, adjustedScore: 10 }; // Push to bottom
      }

      // Apply length penalties
      const transPenalty = calculateLengthPenalty(normalizedQuery, translitLower);
      const iastPenalty = calculateLengthPenalty(normalizedQuery, iastLower);
      const bestPenalty = Math.min(transPenalty, iastPenalty);

      // Check for exact match
      const isExactTrans = translitLower === normalizedQuery;
      const isExactIast = iastLower === normalizedQuery;
      const isPrefixMatch =
        translitLower.startsWith(normalizedQuery) || iastLower.startsWith(normalizedQuery);

      // Boost exact matches and prefix matches
      let boost = 0;
      if (isExactTrans || isExactIast) {
        boost = -0.3; // Strong boost for exact match
      } else if (isPrefixMatch) {
        boost = -0.15; // Medium boost for prefix match
      }

      return {
        ...result,
        adjustedScore: baseScore + bestPenalty + boost,
      };
    })
    .filter((r) => r.adjustedScore < 5) // Remove heavily penalized results
    .sort((a, b) => a.adjustedScore - b.adjustedScore);

  // Return with original score field
  return scoredResults.map(({ adjustedScore, ...result }) => ({
    ...result,
    score: result.score, // Keep original fuse score
  }));
}

/**
 * Quick check if search is ready.
 */
export function isSearchReady(): boolean {
  return fuseInstance !== null;
}

/**
 * Get total number of entries.
 */
export function getEntryCount(): number {
  return dictionaryData.length;
}
