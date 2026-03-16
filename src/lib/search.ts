import { Client } from 'typesense';
import type { SearchResult } from '@/types';

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_TYPESENSE_URL: string;
    readonly PUBLIC_TYPESENSE_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const TYPESENSE_URL = import.meta.env.PUBLIC_TYPESENSE_URL || 'http://localhost:8108';
const TYPESENSE_API_KEY = import.meta.env.PUBLIC_TYPESENSE_API_KEY || 'xyz';
const COLLECTION_NAME = 'dictionary';

let typesenseClient: Client | null = null;

async function getClient(): Promise<Client> {
  if (typesenseClient) return typesenseClient;

  typesenseClient = new Client({
    nodes: [
      {
        url: TYPESENSE_URL,
      },
    ],
    apiKey: TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  return typesenseClient;
}

export async function initSearch(): Promise<void> {
  const client = await getClient();
  try {
    await client.collections(COLLECTION_NAME).retrieve();
  } catch (error) {
    console.error('Failed to connect to TypeSense:', error);
    throw error;
  }
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const client = await getClient();
  const normalizedQuery = query.toLowerCase().trim();

  try {
    const searchResults = await client.collections(COLLECTION_NAME).documents().search({
      q: normalizedQuery,
      query_by: 'word,transliteration,definitions.meaning',
      per_page: 20,
      prefix: true,
      drop_tokens_threshold: 1,
      typo_tokens_threshold: 1,
    });

    return (searchResults.hits || []).map((hit: any) => ({
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
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function getWord(word: string): Promise<SearchResult | null> {
  const client = await getClient();

  try {
    const results = await client.collections(COLLECTION_NAME).documents().search({
      q: word,
      query_by: 'word,transliteration',
      per_page: 1,
      prefix: false,
    });

    if (results.hits && results.hits.length > 0) {
      const hit = results.hits[0] as any;
      return {
        word: hit.document.word,
        transliteration: hit.document.transliteration,
        iast: hit.document.iast,
        urdu: hit.document.urdu,
        ipa: hit.document.ipa,
        definitions: hit.document.definitions,
        forms: hit.document.forms,
        examples: hit.document.examples,
        score: 1 - ((hit.text_match_info?.score || 0) as number) / 100,
      };
    }
    return null;
  } catch (error) {
    console.error('Get word error:', error);
    return null;
  }
}

export async function searchWithExactPriority(query: string): Promise<SearchResult[]> {
  return search(query);
}

export async function isSearchReady(): Promise<boolean> {
  try {
    const client = await getClient();
    await client.collections(COLLECTION_NAME).retrieve();
    return true;
  } catch {
    return false;
  }
}
