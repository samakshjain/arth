import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchResult } from '@/types';
import ResultList from './ResultList';

const DEBOUNCE_MS = 150;
const MIN_QUERY_LENGTH = 2;

export default function SearchContainer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Read query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const { initSearch, searchWithExactPriority } = await import('@/lib/search');
      await initSearch();
      const searchResults = searchWithExactPriority(searchQuery);
      setResults(searchResults.slice(0, 20));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);

      // Update URL for browser history support
      if (query.length >= MIN_QUERY_LENGTH) {
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);

        // Use replaceState on initial load or typing, pushState when navigating back
        if (isInitialMount.current) {
          window.history.replaceState({}, '', url);
          isInitialMount.current = false;
        } else {
          window.history.pushState({}, '', url);
        }
      } else if (query.length === 0) {
        // Clear query param when search is empty
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
      // Clear URL
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    // Clear URL
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.pushState({}, '', url);
  };

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
