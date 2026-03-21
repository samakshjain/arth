import type { APIRoute } from 'astro';
import { Client } from 'typesense';

const TYPESENSE_URL = import.meta.env.PUBLIC_TYPESENSE_URL || 'http://typesense:8108';
const TYPESENSE_API_KEY = import.meta.env.PUBLIC_TYPESENSE_API_KEY || 'xyz';
const COLLECTION_NAME = 'dictionary';

export const prerender = false;

const client = new Client({
  nodes: [{ url: TYPESENSE_URL }],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
});

export const ALL: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const query_by = url.searchParams.get('query_by') || 'word,transliteration,definitions.meaning';
    const per_page = parseInt(url.searchParams.get('per_page') || '20');
    const prefix = url.searchParams.get('prefix') !== 'false';

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ error: 'Query must be at least 2 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await client.collections(COLLECTION_NAME).documents().search({
      q: q.toLowerCase().trim(),
      query_by,
      per_page,
      prefix,
      drop_tokens_threshold: 1,
      typo_tokens_threshold: 1,
    });

    return new Response(JSON.stringify({ hits: results.hits || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed', hits: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
