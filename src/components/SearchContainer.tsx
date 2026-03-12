'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchResult } from '@/types';
import ResultList from './ResultList';

const DEBOUNCE_MS = 150;
const MIN_QUERY_LENGTH = 2;

export default function SearchContainer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Read query from URL only on client side after mount
  useEffect(() => {
    if (!isMounted) return;

    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [isMounted]);

  // Perform search when query changes
  useEffect(() => {
    if (!isMounted) return;

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear results if query is too short
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { initSearch, searchWithExactPriority } = await import('@/lib/search');
        await initSearch();
        const searchResults = searchWithExactPriority(query);
        setResults(searchResults.slice(0, 20));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, isMounted]);

  // Update URL when query changes
  useEffect(() => {
    if (!isMounted) return;

    const url = new URL(window.location.href);
    if (query.length >= MIN_QUERY_LENGTH) {
      url.searchParams.set('q', query);
      window.history.replaceState({}, '', url);
    } else {
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    }
  }, [query, isMounted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
      if (isMounted) {
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    if (isMounted) {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    }
  };

  // Render minimal version during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="w-full">
        <div className="relative w-full mb-6">
          <input
            type="text"
            defaultValue=""
            placeholder="Type a Hindi word, transliteration, or English meaning..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none font-hindi pr-24"
            readOnly
          />
        </div>
        <ResultList results={[]} query="" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full mb-6">
        <label htmlFor="search-input" className="sr-only">
          Search Hindi dictionary
        </label>
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a Hindi word, transliteration, or English meaning..."
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none font-hindi pr-24"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          enterKeyHint="search"
          aria-label="Search Hindi dictionary"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-busy={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div
              className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          )}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-base"
          >
            Search
          </button>
        </div>
      </div>

      <ResultList results={results} query={query} />
    </div>
  );
}
