import type { SearchResult } from '@/types';
import ResultItem from './ResultItem';

interface ResultListProps {
  results: SearchResult[];
  query: string;
  visibleCount?: number;
}

export default function ResultList({ results, query, visibleCount = 20 }: ResultListProps) {
  const hasMore = results.length > visibleCount;
  const visibleResults = results.slice(0, visibleCount);

  if (!query || query.length < 2) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Start typing to search...</p>
        <p className="text-sm mt-2">Try: namaste, चम्मच, water</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600 mb-4">We couldn't find any matches for "{query}"</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Search tips:</p>
          <ul className="list-disc list-inside">
            <li>Try different transliteration spellings</li>
            <li>Use Devanagari script (e.g., नमस्ते)</li>
            <li>Search for English meanings</li>
            <li>Check your spelling</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div id="search-results" role="region" aria-label="Search results" className="space-y-3">
      <div className="text-sm text-gray-500 mb-4">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>

      <div className="grid gap-3">
        {visibleResults.map((result) => (
          <ResultItem key={result.word} result={result} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing {visibleCount} of {results.length} results
          </p>
        </div>
      )}
    </div>
  );
}
