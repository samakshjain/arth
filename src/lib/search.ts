import type { SearchResult } from '@/types';

const API_BASE = '/api';

export async function initSearch(): Promise<void> {
  return;
}

async function apiSearch(
  q: string,
  queryBy: string = 'word,transliteration,definitions.meaning',
  perPage: number = 20,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q, query_by: queryBy, per_page: perPage.toString() });
  const response = await fetch(`${API_BASE}/search?${params}`);
  const data = await response.json();

  return (data.hits || []).map((hit: any) => ({
    word: hit.document.word,
    transliteration: hit.document.transliteration,
    iast: hit.document.iast,
    urdu: hit.document.urdu,
    ipa: hit.document.ipa,
    definitions: hit.document.definitions,
    forms: hit.document.forms,
    examples: hit.document.examples,
    score: 1 - (hit.text_match_info?.score || 0) / 100,
  }));
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    return await apiSearch(query);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function getWord(word: string): Promise<SearchResult | null> {
  try {
    const results = await apiSearch(word, 'word,transliteration', 1);
    return results[0] || null;
  } catch (error) {
    console.error('Get word error:', error);
    return null;
  }
}

export async function searchWithExactPriority(query: string): Promise<SearchResult[]> {
  return search(query);
}

export async function isSearchReady(): Promise<boolean> {
  return true;
}
